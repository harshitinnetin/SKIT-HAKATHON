import express from 'express';
import prisma from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { streamChat } from '../controllers/chatController.js';
import { chatListCache, analyticsCache, TtlCache } from '../config/cache.js';

const router = express.Router();
router.use(authenticate);

// Per-chat detail cache: chatId → { chat } payload. 15s TTL.
// Busted whenever a message is sent or chat is modified.
const chatDetailCache = new TtlCache({ maxSize: 300, defaultTtlMs: 15_000 });

// Safe response helper — prevents ERR_HTTP_HEADERS_SENT if timeout already fired
const safeSend = (res, statusOrPayload, payload) => {
  if (res.headersSent) return;
  if (payload !== undefined) {
    res.status(statusOrPayload).json(payload);
  } else {
    res.json(statusOrPayload);
  }
};

// ─── List busting helpers ────────────────────────────────────────────────────
const bustChatList  = (userId)  => chatListCache.delete(`chats:${userId}`);
const bustChatDetail = (chatId) => chatDetailCache.delete(`chat:${chatId}`);
const bustAnalytics  = (userId) => {
  analyticsCache.delete(`analytics:${userId}`);
  analyticsCache.delete(`analytics:usage:${userId}`);
};

// GET /api/chat - List all chats (cached 30s with coalescing)
router.get('/', async (req, res) => {
  try {
    const userId   = req.user.id;
    const cacheKey = `chats:${userId}`;

    const payload = await chatListCache.getOrFetch(cacheKey, async () => {
      const chats = await prisma.chat.findMany({
        where: { userId },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { content: true, createdAt: true, role: true },
          },
          chatDocuments: {
            include: { document: { select: { id: true, title: true } } },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
      return { chats };
    }, 30_000);

    safeSend(res, payload);
  } catch (error) {
    console.error('List chats error:', error);
    safeSend(res, 500, { error: 'Failed to fetch chats' });
  }
});

// POST /api/chat - Create new chat
router.post('/', async (req, res) => {
  try {
    const { documentIds, title } = req.body;

    const chat = await prisma.chat.create({
      data: {
        userId: req.user.id,
        title: title || 'New Chat',
        chatDocuments: documentIds?.length
          ? { create: documentIds.map(id => ({ documentId: id })) }
          : undefined,
      },
      include: { chatDocuments: { include: { document: true } } },
    });

    bustChatList(req.user.id);
    safeSend(res, 201, { chat });
  } catch (error) {
    console.error('Create chat error:', error);
    safeSend(res, 500, { error: 'Failed to create chat' });
  }
});

// POST /api/chat/send — Unified: create chat + send first message in ONE round-trip
router.post('/send', aiLimiter, async (req, res) => {
  try {
    const { message, documentIds, title } = req.body;
    if (!message?.trim()) return safeSend(res, 400, { error: 'Message cannot be empty' });

    const chat = await prisma.chat.create({
      data: {
        userId: req.user.id,
        title: title || message.slice(0, 60) || 'New Chat',
        chatDocuments: documentIds?.length
          ? { create: documentIds.map(id => ({ documentId: id })) }
          : undefined,
      },
    });

    const chatId = chat.id;
    await prisma.message.create({ data: { chatId, role: 'USER', content: message } });

    // Bust list cache so new chat appears immediately
    bustChatList(req.user.id);

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.write(`data: ${JSON.stringify({ chatId, type: 'init' })}\n\n`);
    res.flushHeaders();

    const sendEvent = (data) => {
      if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    await streamChat({ chatId, userId: req.user.id, message, documentIds: documentIds || [], sendEvent, res });

    // Background: update title + bust detail cache
    prisma.chat.update({
      where: { id: chatId },
      data: { title: message.slice(0, 60) || 'New Chat', updatedAt: new Date() },
    }).then(() => bustChatDetail(chatId)).catch(() => {});

  } catch (error) {
    console.error('Send chat error:', error);
    if (!res.headersSent) safeSend(res, 500, { error: 'Chat failed' });
  }
});

// GET /api/chat/:id - Get chat with messages (cached 15s)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId   = req.user.id;
    const cacheKey = `chat:${id}`;

    const payload = await chatDetailCache.getOrFetch(cacheKey, async () => {
      const chat = await prisma.chat.findFirst({
        where: { id, userId },
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
          chatDocuments: {
            include: { document: { select: { id: true, title: true, pageCount: true } } },
          },
        },
      });
      if (!chat) return null;
      return { chat };
    }, 15_000);

    if (!payload) return safeSend(res, 404, { error: 'Chat not found' });
    safeSend(res, payload);
  } catch (error) {
    console.error('Get chat error:', error);
    safeSend(res, 500, { error: 'Failed to fetch chat' });
  }
});

// DELETE /api/chat/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.chat.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    bustChatList(req.user.id);
    bustChatDetail(req.params.id);
    bustAnalytics(req.user.id);
    safeSend(res, { message: 'Chat deleted' });
  } catch (error) {
    console.error('Delete chat error:', error);
    safeSend(res, 500, { error: 'Failed to delete chat' });
  }
});

// PATCH /api/chat/:id - Update chat (title, pin)
router.patch('/:id', async (req, res) => {
  try {
    const { title, isPinned } = req.body;
    await prisma.chat.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: {
        ...(title     !== undefined && { title }),
        ...(isPinned  !== undefined && { isPinned }),
      },
    });
    bustChatList(req.user.id);
    bustChatDetail(req.params.id);
    safeSend(res, { message: 'Chat updated' });
  } catch (error) {
    console.error('Update chat error:', error);
    safeSend(res, 500, { error: 'Failed to update chat' });
  }
});

// POST /api/chat/:id/message - Send message (SSE streaming)
router.post('/:id/message', aiLimiter, async (req, res) => {
  try {
    const { message, documentIds } = req.body;
    const chatId = req.params.id;

    if (!message?.trim()) return safeSend(res, 400, { error: 'Message cannot be empty' });

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: req.user.id },
      include: { chatDocuments: true },
    });
    if (!chat) return safeSend(res, 404, { error: 'Chat not found' });

    await prisma.message.create({ data: { chatId, role: 'USER', content: message } });

    // Invalidate the chat detail cache so next GET shows new message
    bustChatDetail(chatId);
    bustChatList(req.user.id);

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const sendEvent = (data) => {
      if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const docIds = documentIds || chat.chatDocuments.map(cd => cd.documentId);
    await streamChat({ chatId, userId: req.user.id, message, documentIds: docIds, sendEvent, res });

    // Background: update timestamp, bust cache again
    const messageCount = await prisma.message.count({ where: { chatId } });
    const updateData = messageCount <= 2
      ? { title: message.slice(0, 60) || 'New Chat', updatedAt: new Date() }
      : { updatedAt: new Date() };
    prisma.chat.update({ where: { id: chatId }, data: updateData })
      .then(() => { bustChatDetail(chatId); bustChatList(req.user.id); })
      .catch(() => {});

  } catch (error) {
    console.error('Chat message error:', error);
    if (!res.headersSent) safeSend(res, 500, { error: 'Chat failed' });
  }
});

// POST /api/chat/:id/feedback
router.post('/:id/feedback', async (req, res) => {
  try {
    const { messageId, feedback } = req.body;
    await prisma.messageFeedback.upsert({
      where: { messageId_userId: { messageId, userId: req.user.id } },
      create: { messageId, userId: req.user.id, feedback },
      update: { feedback },
    });
    safeSend(res, { message: 'Feedback saved' });
  } catch (error) {
    safeSend(res, 500, { error: 'Failed to save feedback' });
  }
});

export default router;
