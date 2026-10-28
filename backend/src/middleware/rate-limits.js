import { rateLimit } from 'express-rate-limit';
const make = (windowMs, limit) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        status: 'error',
        message: 'Too many requests. Please try again later.',
        data: null,
      }),
  });
export const authLimiter = make(15 * 60 * 1000, 30);
export const resetLimiter = make(15 * 60 * 1000, 10);
export const publicLimiter = make(60 * 1000, 120);
export const resendLimiter = make(15 * 60 * 1000, 10);
// Scaffold IP limits only. Task owners must add normalized-account/order limits and a
// shared store for multi-instance production before enabling the corresponding APIs.
