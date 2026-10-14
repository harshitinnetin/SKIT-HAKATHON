import express from 'express';
import prisma from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import openrouter, { AI_MODEL } from '../config/openrouter.js';

const router = express.Router();
router.use(authenticate);

const streamAIResponse = async (res, prompt, systemPrompt) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const stream = await openrouter.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    stream: true,
    max_tokens: 4000,
    temperature: 0.7,
  });

  let fullContent = '';
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || '';
    if (token) {
      fullContent += token;
      res.write(`data: ${JSON.stringify({ token, done: false })}\n\n`);
    }
  }
  res.write(`data: ${JSON.stringify({ done: true, content: fullContent })}\n\n`);
  res.end();
  return fullContent;
};

// POST /api/ai/summarize - Summarize a document
router.post('/summarize', aiLimiter, async (req, res) => {
  try {
    const { documentId, type = 'summary' } = req.body;

    const document = await prisma.document.findFirst({
      where: { id: documentId, userId: req.user.id },
      include: { chunks: { take: 50, orderBy: { chunkIndex: 'asc' } } },
    });

    if (!document) return res.status(404).json({ error: 'Document not found' });

    const text = document.chunks.map(c => c.content).join('\n\n');

    const systemPrompts = {
      summary: 'You are an expert document analyst. Provide a comprehensive summary in markdown format.',
      executive: 'You are a C-suite executive assistant. Provide a concise executive summary with key decisions, risks, and recommendations in markdown.',
      bullets: 'You are a note-taking expert. Extract the most important points as well-organized bullet points in markdown.',
      insights: 'You are a data analyst. Extract unique insights, patterns, and hidden themes from this document in markdown.',
    };

    const userPrompt = `Document: "${document.title}"\n\nContent:\n${text.slice(0, 15000)}\n\nProvide a ${type} in markdown format.`;

    await streamAIResponse(res, userPrompt, systemPrompts[type] || systemPrompts.summary);
  } catch (error) {
    console.error('Summary error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Summary generation failed' });
  }
});

// POST /api/ai/quiz - Generate quiz
router.post('/quiz', aiLimiter, async (req, res) => {
  try {
    const { documentId, count = 10, difficulty = 'medium' } = req.body;

    const document = await prisma.document.findFirst({
      where: { id: documentId, userId: req.user.id },
      include: { chunks: { take: 30, orderBy: { chunkIndex: 'asc' } } },
    });

    if (!document) return res.status(404).json({ error: 'Document not found' });

    const text = document.chunks.map(c => c.content).join('\n\n');

    const prompt = `Generate ${count} multiple-choice questions (${difficulty} difficulty) from this document.
Return ONLY valid JSON array: [{"id":1,"question":"...","options":["A) option text","B) option text","C) option text","D) option text"],"answer":"A","explanation":"..."}]
Document: ${text.slice(0, 12000)}`;

    const completion = await openrouter.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert quiz creator. Return only valid JSON array.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 4000,
    });

    const raw = completion.choices[0].message.content.trim();
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Failed to parse quiz JSON');

    let questions = JSON.parse(jsonMatch[0]);

    // Normalize formatting to prevent frontend rendering crashes
    questions = questions.map((q, idx) => {
      const letters = ['A', 'B', 'C', 'D'];
      const normalizedOptions = (q.options || []).map((opt, i) => {
        const prefix = `${letters[i]}) `;
        if (opt.toUpperCase().startsWith(prefix.toUpperCase())) {
          return prefix + opt.slice(3).trim();
        }
        return prefix + opt.trim();
      });

      // Ensure answer is a single uppercase letter
      let ans = String(q.answer || 'A').toUpperCase().trim();
      if (ans.length > 1) ans = ans[0];
      if (!letters.includes(ans)) ans = 'A';

      return {
        id: q.id || idx + 1,
        question: q.question || 'Review Question',
        options: normalizedOptions.slice(0, 4),
        answer: ans,
        explanation: q.explanation || 'Refer to the document context.',
      };
    });

    res.json({ questions, documentTitle: document.title });
  } catch (error) {
    console.error('Quiz error:', error);
    res.status(500).json({ error: 'Quiz generation failed' });
  }
});

// POST /api/ai/flashcards - Generate flashcards
router.post('/flashcards', aiLimiter, async (req, res) => {
  try {
    const { documentId, count = 15 } = req.body;

    const document = await prisma.document.findFirst({
      where: { id: documentId, userId: req.user.id },
      include: { chunks: { take: 30, orderBy: { chunkIndex: 'asc' } } },
    });

    if (!document) return res.status(404).json({ error: 'Document not found' });

    const text = document.chunks.map(c => c.content).join('\n\n');

    const prompt = `Create ${count} flashcards from this document.
Return ONLY valid JSON: [{"id":1,"front":"concept/question","back":"definition/answer","difficulty":"easy|medium|hard"}]
Document: ${text.slice(0, 12000)}`;

    const completion = await openrouter.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert educator creating flashcards. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 3000,
    });

    const raw = completion.choices[0].message.content.trim();
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Failed to parse flashcards JSON');

    const flashcards = JSON.parse(jsonMatch[0]);
    res.json({ flashcards, documentTitle: document.title });
  } catch (error) {
    res.status(500).json({ error: 'Flashcard generation failed' });
  }
});

// POST /api/ai/translate - Translate document content
router.post('/translate', aiLimiter, async (req, res) => {
  try {
    const { documentId, targetLanguage } = req.body;

    const document = await prisma.document.findFirst({
      where: { id: documentId, userId: req.user.id },
      include: { chunks: { take: 20, orderBy: { chunkIndex: 'asc' } } },
    });

    if (!document) return res.status(404).json({ error: 'Document not found' });

    const text = document.chunks.map(c => c.content).join('\n\n');
    const prompt = `Translate the following document content to ${targetLanguage}. Preserve formatting and structure.\n\n${text.slice(0, 8000)}`;

    await streamAIResponse(res, prompt, `You are an expert translator. Translate accurately to ${targetLanguage} while preserving meaning and formatting.`);
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: 'Translation failed' });
  }
});

// POST /api/ai/compare - Compare two documents
router.post('/compare', aiLimiter, async (req, res) => {
  try {
    const { documentId1, documentId2 } = req.body;

    const [doc1, doc2] = await Promise.all([
      prisma.document.findFirst({
        where: { id: documentId1, userId: req.user.id },
        include: { chunks: { take: 20, orderBy: { chunkIndex: 'asc' } } },
      }),
      prisma.document.findFirst({
        where: { id: documentId2, userId: req.user.id },
        include: { chunks: { take: 20, orderBy: { chunkIndex: 'asc' } } },
      }),
    ]);

    if (!doc1 || !doc2) return res.status(404).json({ error: 'One or both documents not found' });

    const text1 = doc1.chunks.map(c => c.content).join('\n').slice(0, 6000);
    const text2 = doc2.chunks.map(c => c.content).join('\n').slice(0, 6000);

    const prompt = `Compare these two documents and provide:\n1. Key similarities\n2. Key differences\n3. Unique points in Document 1\n4. Unique points in Document 2\n5. Overall comparison summary\n\nDocument 1: "${doc1.title}"\n${text1}\n\nDocument 2: "${doc2.title}"\n${text2}`;

    await streamAIResponse(res, prompt, 'You are an expert document analyst. Compare documents thoroughly in markdown format with clear sections.');
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: 'Comparison failed' });
  }
});

export default router;
