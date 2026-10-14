import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { profileCache } from '../config/cache.js';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'docmind-jwt-secret-key-2026';

/**
 * authenticate — Robust Auth Middleware with Guaranteed Profile Integrity
 * Prevents foreign key constraint violations by ensuring req.user.id always exists in the database.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { userId, email, role, plan, fullName, avatarUrl } = decoded;

    // ── Check cache first (fast path) ────────────────────────────────────────
    const cacheKey = `profile:${userId}`;
    let profile = await profileCache.get(cacheKey);

    if (!profile) {
      // Query active database by userId
      profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { id: true, email: true, fullName: true, role: true, plan: true, avatarUrl: true },
      });

      // If user profile is not found by ID (e.g., token from pre-migration or switched DB)
      if (!profile && email) {
        const normalizedEmail = email.toLowerCase().trim();
        const existingByEmail = await prisma.profile.findUnique({
          where: { email: normalizedEmail },
          select: { id: true, email: true, fullName: true, role: true, plan: true, avatarUrl: true },
        });

        if (existingByEmail) {
          profile = existingByEmail;
        } else {
          // Auto-provision profile with this ID so foreign key constraints are NEVER violated
          profile = await prisma.profile.create({
            data: {
              id: userId,
              email: normalizedEmail,
              fullName: fullName || normalizedEmail.split('@')[0],
              role: role || 'VERIFIER',
              plan: plan || 'FREE',
            },
            select: { id: true, email: true, fullName: true, role: true, plan: true, avatarUrl: true },
          });
        }
      }

      if (profile) {
        profileCache.set(cacheKey, profile, 5 * 60_000);
      }
    }

    if (!profile) {
      return res.status(401).json({ error: 'User session invalid. Please log in again.' });
    }

    req.user = profile;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    next(error);
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const invalidateProfileCache = (userId) => {
  profileCache.delete(`profile:${userId}`);
};
