import type { Request, Response, NextFunction } from 'express';
import { config } from './config';
import rateLimit from 'express-rate-limit';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('x-api-key') || '';
  if (header !== config.serviceApiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

export const limiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 60, // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    // Normalize IPv6 localhost
    return ip === '::1' ? '127.0.0.1' : ip;
  },
});
