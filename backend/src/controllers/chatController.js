import prisma from '../config/prisma.js';
import openrouter, { AI_MODEL } from '../config/openrouter.js';

// ── In-memory embedding cache (LRU-style, per process) ──────────────────────
// Key: query string (trimmed lowercase) → Value: { embedding, ts }
// Avoids redundant embedding API calls for identical or near-identical queries
const embeddingCache = new Map();
const CACHE_MAX = 200;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

const getCachedEmbedding = async (text) => {
  const key = text.trim().toLowerCase().slice(0, 500);
  const cached = embeddingCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.embedding;
  }
  const resp = await openrouter.embeddings.create({
    model: 'openai/text-embedding-3-small',
    input: text.slice(0, 8000),
  });
  const embedding = resp.data[0].embedding;

  // Evict oldest if at capacity
  if (embeddingCache.size >= CACHE_MAX) {
    const oldest = embeddingCache.keys().next().value;
    embeddingCache.delete(oldest);
  }
  embeddingCache.set(key, { embedding, ts: Date.now() });
  return embedding;
};

// Cosine similarity between two vectors
const cosineSimilarity = (a, b) => {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Get relevant chunks via embedding similarity — parallelized
export const getRelevantChunks = async (query, documentIds, topK = 6) => {
  // Run embedding lookup and chunk fetch IN PARALLEL
  const [queryEmbedding, chunks] = await Promise.all([
    getCachedEmbedding(query),
    prisma.documentChunk.findMany({
      where: { documentId: { in: documentIds }, embedding: { not: null } },
      include: { document: { select: { title: true, id: true } } },
    }),
  ]);

  if (chunks.length === 0) {
    const fallback = await prisma.documentChunk.findMany({
      where: { documentId: { in: documentIds } },
      take: topK,
      orderBy: { chunkIndex: 'asc' },
      include: { document: { select: { title: true, id: true } } },
    });
    return fallback.map(c => ({ ...c, similarity: 1 }));
  }

  const scored = chunks.map(chunk => {
    try {
      return { ...chunk, similarity: cosineSimilarity(queryEmbedding, JSON.parse(chunk.embedding)) };
    } catch {
      return { ...chunk, similarity: 0 };
    }
  });
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
};

// ── Main RAG streaming function ───────────────────────────────────────────────
export const streamChat = async ({ chatId, userId, message, documentIds, sendEvent, res }) => {
  try {
    let relevantChunks = [];
    let contextText = '';

    // ⚡ Parallelise: embedding search + chat history fetch simultaneously
    const [chunksResult, history] = await Promise.all([
      documentIds?.length > 0
        ? getRelevantChunks(message, documentIds)
        : Promise.resolve([]),
      prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),
    ]);

    relevantChunks = chunksResult;
    contextText = relevantChunks
      .map((c, i) => `[Source ${i + 1}: ${c.document.title}, Page ${c.pageNumber || '?'}]\n${c.content}`)
      .join('\n\n---\n\n');

    const systemPrompt = documentIds?.length > 0
      ? `You are DocMind AI, an intelligent document assistant. Answer questions based ONLY on the provided document context. Always cite your sources with [Source N, Page X] references. If the answer is not in the context, say so clearly.\n\nDOCUMENT CONTEXT:\n${contextText}`
      : `You are DocMind AI, an intelligent AI assistant specialized in document understanding. Be helpful, accurate, and concise.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map(m => ({ role: m.role.toLowerCase(), content: m.content })),
      { role: 'user', content: message },
    ];

    // ⚡ Start streaming immediately — don't wait for DB save
    const stream = await openrouter.chat.completions.create({
      model: AI_MODEL,
      messages,
      stream: true,
      max_tokens: 3000,
      temperature: 0.3,
    });

    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        fullContent += token;
        sendEvent({ token, done: false });
      }
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens || 0;
        outputTokens = chunk.usage.completion_tokens || 0;
      }
    }

    const citations = relevantChunks.map((c, i) => ({
      index: i + 1,
      documentId: c.documentId,
      documentTitle: c.document.title,
      pageNumber: c.pageNumber,
      content: c.content.slice(0, 200) + '...',
      similarity: c.similarity,
    }));

    // ⚡ Fire-and-forget DB saves — don't block the response end
    const savePromise = prisma.message.create({
      data: {
        chatId,
        role: 'ASSISTANT',
        content: fullContent,
        citations: citations.length > 0 ? JSON.stringify(citations) : null,
        tokens: inputTokens + outputTokens,
        model: AI_MODEL,
      },
    });

    // Send completion event immediately, DB saves happen in background
    savePromise.then(savedMessage => {
      // Usage log (non-blocking)
      if (inputTokens + outputTokens > 0) {
        prisma.apiUsage.create({
          data: { userId, model: AI_MODEL, inputTokens, outputTokens, action: 'chat' },
        }).catch(() => {});
      }
      // We already sent done=true, messageId arrives later — frontend handles it
    }).catch(err => console.error('Background DB save error:', err));

    // Send done immediately with temp messageId, real one arrives via background save
    sendEvent({ done: true, messageId: `temp_${Date.now()}`, citations, content: fullContent });
    res.end();

  } catch (error) {
    console.error('Stream chat error:', error);
    sendEvent({ error: 'AI response failed. Please try again.', done: true });
    res.end();
  }
};
