import express from 'express';
import prisma from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { analyticsCache } from '../config/cache.js';

const router = express.Router();
router.use(authenticate);

// GET /api/analytics - User analytics (cached 2 min)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const data = await analyticsCache.getOrFetch(`analytics:${userId}`, async () => {
      // ── Batch 1: lightweight counts (max 5 pool slots) ──────────────────
      const [
        totalDocuments,
        totalChats,
        totalMessages,
        ocrDocs,
        ocrSuccess,
      ] = await Promise.all([
        prisma.document.count({ where: { userId } }),
        prisma.chat.count({ where: { userId } }),
        prisma.message.count({ where: { chat: { userId } } }),
        prisma.document.count({ where: { userId, isScanned: true } }),
        prisma.document.count({ where: { userId, isScanned: true, status: 'READY' } }),
      ]);

      // ── Batch 2: aggregates + recent lists (max 5 pool slots) ───────────
      const [
        recentDocuments,
        recentChats,
        tokenUsage,
        documentStatuses,
        totalStorageBytes,
      ] = await Promise.all([
        prisma.document.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, fileSize: true, status: true, createdAt: true },
        }),
        prisma.chat.findMany({
          where: { userId },
          take: 5,
          orderBy: { updatedAt: 'desc' },
          select: { id: true, title: true, updatedAt: true },
        }),
        prisma.apiUsage.aggregate({
          where: { userId },
          _sum: { inputTokens: true, outputTokens: true },
        }),
        prisma.document.groupBy({
          by: ['status'],
          where: { userId },
          _count: true,
        }),
        prisma.document.aggregate({
          where: { userId },
          _sum: { fileSize: true },
        }),
      ]);

      return {
        stats: {
          totalDocuments,
          totalChats,
          totalMessages,
          totalTokens: (tokenUsage._sum.inputTokens || 0) + (tokenUsage._sum.outputTokens || 0),
          storageUsedBytes: totalStorageBytes._sum.fileSize || 0,
          ocrSuccessRate: ocrDocs > 0 ? Math.round((ocrSuccess / ocrDocs) * 100) : 100,
          documentStatuses,
        },
        recentDocuments,
        recentChats,
      };
    }, 2 * 60_000);

    res.json(data);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/usage - Monthly token usage chart (cached 5 min)
router.get('/usage', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await analyticsCache.getOrFetch(`analytics:usage:${userId}`, async () => {
      const usage = await prisma.apiUsage.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { inputTokens: true, outputTokens: true, createdAt: true, action: true },
        orderBy: { createdAt: 'asc' },
      });

      const byDay = {};
      usage.forEach(u => {
        const day = u.createdAt.toISOString().split('T')[0];
        if (!byDay[day]) byDay[day] = { date: day, tokens: 0, requests: 0 };
        byDay[day].tokens += (u.inputTokens + u.outputTokens);
        byDay[day].requests += 1;
      });

      return { usage: Object.values(byDay) };
    }, 5 * 60_000);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

export default router;
