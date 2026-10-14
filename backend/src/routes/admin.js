import express from 'express';
import prisma from '../config/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/stats - System-wide stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalDocuments, totalChats, totalMessages] = await Promise.all([
      prisma.profile.count(),
      prisma.document.count(),
      prisma.chat.count(),
      prisma.message.count(),
    ]);

    const recentUsers = await prisma.profile.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, fullName: true, role: true, plan: true, createdAt: true },
    });

    const storageStats = await prisma.document.aggregate({ _sum: { fileSize: true } });

    res.json({
      stats: { totalUsers, totalDocuments, totalChats, totalMessages, totalStorageBytes: storageStats._sum.fileSize || 0 },
      recentUsers,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GET /api/admin/users - List all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search
      ? { OR: [{ email: { contains: search, mode: 'insensitive' } }, { fullName: { contains: search, mode: 'insensitive' } }] }
      : {};

    const [users, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, fullName: true, role: true, plan: true, createdAt: true, _count: { select: { documents: true, chats: true } } },
      }),
      prisma.profile.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /api/admin/users/:id - Update user role/plan
router.patch('/users/:id', async (req, res) => {
  try {
    const { role, plan } = req.body;
    const user = await prisma.profile.update({
      where: { id: req.params.id },
      data: { ...(role && { role }), ...(plan && { plan }) },
    });
    res.json({ user, message: 'User updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await prisma.profile.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/admin/documents - All documents
router.get('/documents', async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { profile: { select: { email: true, fullName: true } } },
    });
    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

export default router;
