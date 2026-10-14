import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import chatRoutes from './routes/chat.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';

// API Gateway middleware
import { requestTimeout, responseTimer, etagSupport } from './middleware/gateway.js';
import { generalLimiter } from './middleware/rateLimit.js';

config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Build allowed origins: comma-separated FRONTEND_URL env var + local dev defaults
const allowedOrigins = [
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
    : []
  ),
  'http://localhost:5173',
  'http://localhost:5174',
  'https://docmindsai.vercel.app',  // always allow the production frontend
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing + compression ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression({ level: 6, threshold: 1024 })); // gzip responses > 1KB

// ── API Gateway layer ─────────────────────────────────────────────────────────
app.use(responseTimer());          // X-Response-Time + slow query warnings
app.use(requestTimeout(25_000));   // 25s hard timeout (skips SSE routes)
app.use(etagSupport());            // ETag / 304 Not Modified for GET lists
app.use(generalLimiter);           // Global rate limiter (200 req / 15 min)

// ── Logging ───────────────────────────────────────────────────────────────────
// Only log method+url+status+time (skip body for brevity)
app.use(morgan(':method :url :status :response-time ms'));

// Enable express ETag generation (works with etagSupport middleware)
app.set('etag', 'strong');

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 DocMind AI Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`⚡ Cache layer: enabled (profile 5m | chats/docs 30s | analytics 2m)`);
  console.log(`🛡️  Gateway: timeout 25s | ETag | gzip | rate-limit active`);

  // ── Self-ping keep-alive (Render free tier) ───────────────────────────────
  // Render spins down instances after 15 min of inactivity.
  // We ping our own /health endpoint every 14 minutes to stay awake.
  if (process.env.NODE_ENV === 'production') {
    const SELF_URL = process.env.RENDER_EXTERNAL_URL
      ? `${process.env.RENDER_EXTERNAL_URL}/health`
      : `http://localhost:${PORT}/health`;

    const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

    setInterval(async () => {
      try {
        const res = await fetch(SELF_URL);
        console.log(`🏓 Keep-alive ping → ${SELF_URL} [${res.status}]`);
      } catch (err) {
        console.warn(`⚠️  Keep-alive ping failed: ${err.message}`);
      }
    }, PING_INTERVAL_MS);

    console.log(`🏓 Keep-alive: pinging ${SELF_URL} every 14 min`);
  }
});

// Server initialized successfully - v2.0
export default app;
