import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { invalidateProfileCache, authenticate } from '../middleware/auth.js';

const router = express.Router();

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'docmind-jwt-secret-key-2026';
const REFRESH_TOKEN_SECRET = (process.env.JWT_SECRET || 'docmind-jwt-secret-key-2026') + '-refresh';

// Generate short-lived Access Token (1 hour)
const generateAccessToken = (profile) => {
  return jwt.sign(
    {
      userId:    profile.id,
      email:     profile.email,
      role:      profile.role,
      plan:      profile.plan,
      fullName:  profile.fullName  || null,
      avatarUrl: profile.avatarUrl || null,
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
  );
};

// Generate and persist long-lived Refresh Token (30 days)
const createRefreshToken = async (userId) => {
  const token = jwt.sign({ userId, tokenId: uuidv4() }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
};

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, fullName, role = 'USER' } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.profile.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const validRoles = ['USER', 'ADMIN', 'FACULTY', 'VERIFIER', 'STUDENT'];
    const assignedRole = validRoles.includes(role.toUpperCase()) ? role.toUpperCase() : 'USER';

    const hashedPassword = await bcrypt.hash(password, 12);

    const profile = await prisma.profile.create({
      data: {
        email: normalizedEmail,
        fullName,
        password: hashedPassword,
        role: assignedRole,
      },
    });

    const token = generateAccessToken(profile);
    const refreshToken = await createRefreshToken(profile.id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      refreshToken,
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        role: profile.role,
        plan: profile.plan,
        avatarUrl: profile.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Auto-seed admin if admin@docmind.ai tries logging in
    if (normalizedEmail === 'admin@docmind.ai') {
      let adminProfile = await prisma.profile.findUnique({ where: { email: 'admin@docmind.ai' } });
      const hashedPassword = await bcrypt.hash('admin1234', 12);
      if (!adminProfile) {
        await prisma.profile.create({
          data: {
            email: 'admin@docmind.ai',
            fullName: 'System Administrator',
            password: hashedPassword,
            role: 'ADMIN',
            plan: 'ENTERPRISE',
          },
        });
      } else if (adminProfile.role !== 'ADMIN') {
        await prisma.profile.update({
          where: { email: 'admin@docmind.ai' },
          data: { role: 'ADMIN', plan: 'ENTERPRISE', password: hashedPassword },
        });
      }
    }

    const profile = await prisma.profile.findUnique({ where: { email: normalizedEmail } });
    if (!profile || !profile.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, profile.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateAccessToken(profile);
    const refreshToken = await createRefreshToken(profile.id);

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        role: profile.role,
        plan: profile.plan,
        avatarUrl: profile.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh - Refresh Access Token via Refresh Token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token signature
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Find token in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { profile: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) await prisma.refreshToken.delete({ where: { token: refreshToken } });
      return res.status(401).json({ error: 'Refresh token revoked or expired' });
    }

    // Rotate refresh token: delete old, create new
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    const newRefreshToken = await createRefreshToken(storedToken.profile.id);
    const newAccessToken = generateAccessToken(storedToken.profile);

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: storedToken.profile.id,
        email: storedToken.profile.email,
        fullName: storedToken.profile.fullName,
        role: storedToken.profile.role,
        plan: storedToken.profile.plan,
        avatarUrl: storedToken.profile.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// POST /api/auth/logout - Revoke Refresh Token
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.json({ message: 'Logged out' });
  }
});

// POST /api/auth/switch-role - For Demo & Hackathon testing
router.post('/switch-role', authenticate, async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['USER', 'ADMIN', 'FACULTY', 'VERIFIER', 'STUDENT'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updated = await prisma.profile.update({
      where: { id: req.user.id },
      data: { role },
    });

    invalidateProfileCache(req.user.id);
    const token = generateAccessToken(updated);

    res.json({
      message: `Role switched to ${role}`,
      token,
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role,
        plan: updated.plan,
        avatarUrl: updated.avatarUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to switch role' });
  }
});

// POST /api/auth/guest
router.post('/guest', async (req, res) => {
  try {
    const guestEmail = 'guest@docmind.ai';

    const profile = await prisma.profile.upsert({
      where: { email: guestEmail },
      update: {},
      create: {
        email: guestEmail,
        fullName: 'Guest Explorer',
        role: 'VERIFIER', // Give rich demo permissions to guest
      },
    });

    const token = generateAccessToken(profile);
    const refreshToken = await createRefreshToken(profile.id);

    res.json({
      message: 'Guest session created',
      token,
      refreshToken,
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        role: profile.role,
        plan: profile.plan,
        avatarUrl: profile.avatarUrl,
        isGuest: true,
      },
    });
  } catch (error) {
    console.error('Guest auth error:', error);
    res.status(500).json({ error: 'Failed to create guest session' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    const profile = await prisma.profile.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, fullName: true, role: true, plan: true, avatarUrl: true, createdAt: true },
    });
    if (!profile) return res.status(404).json({ error: 'User not found' });
    res.json({ user: profile });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
