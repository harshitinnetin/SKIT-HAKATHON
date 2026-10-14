/**
 * API Gateway Middleware Layer
 *
 * 1. requestTimeout  — kills hung non-SSE requests after N ms
 * 2. responseTimer   — logs slow queries; warns when > 2s
 * 3. etagSupport     — sets Cache-Control for GET routes so Express's
 *                      built-in ETag generates 304 Not Modified automatically.
 *                      Does NOT override res.json to avoid ERR_HTTP_HEADERS_SENT.
 */

/**
 * Server-side request timeout.
 * Streams (SSE) are excluded; they manage their own lifecycle.
 */
export const requestTimeout = (ms = 25_000) => (req, res, next) => {
  const isStream = req.path.includes('/message') || req.path.includes('/send')
    || req.path.includes('/summarize') || req.path.includes('/translate')
    || req.path.includes('/compare') || req.path.includes('/flashcards')
    || req.path.includes('/quiz') || req.path.includes('/upload');

  if (isStream) return next();

  const timer = setTimeout(() => {
    if (!res.headersSent) {
      console.warn(`[Timeout] ${req.method} ${req.originalUrl} exceeded ${ms}ms`);
      res.status(503).json({ error: 'Request timed out. Please try again.' });
    }
  }, ms);

  res.on('finish', () => clearTimeout(timer));
  res.on('close',  () => clearTimeout(timer));
  next();
};

/**
 * Response timer — logs slow requests to console.
 */
export const responseTimer = () => (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (ms > 2000) {
      console.warn(`[SLOW] ${req.method} ${req.originalUrl} → ${res.statusCode} in ${ms}ms`);
    }
  });
  next();
};

/**
 * ETag / Cache-Control support for GET routes.
 *
 * Sets `Cache-Control: private, must-revalidate` BEFORE the route runs
 * (not by intercepting res.json) so Express's built-in ETag machinery
 * can return 304 Not Modified on repeated identical responses.
 *
 * Safe: this runs before any response is sent so it never collides with
 * a timeout or error response — no ERR_HTTP_HEADERS_SENT possible.
 */
export const etagSupport = () => (req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'private, must-revalidate');
  }
  next();
};
