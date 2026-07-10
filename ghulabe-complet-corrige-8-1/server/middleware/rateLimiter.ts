import { Request, Response, NextFunction } from 'express';
import { generateAuditLog } from '../utils/crypto';

// Simulation de cache Redis en mémoire pour le rate limiting et les scans en cours
const requestCounts = new Map<string, { count: number; firstRequestTime: number }>();
const scanCounts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // Strict : 100 requêtes / min

const SCAN_WINDOW_MS = 60 * 60 * 1000; // 1 heure
const MAX_SCANS_PER_HOUR = 10; // Strict : 10 scans / heure par IP

/**
 * Rate limiter strict sur toutes les routes API
 */
export function apiRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();

  const record = requestCounts.get(ip);
  if (!record || now - record.firstRequestTime > RATE_LIMIT_WINDOW_MS) {
    requestCounts.set(ip, { count: 1, firstRequestTime: now });
    return next();
  }

  record.count += 1;
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    generateAuditLog({
      action: 'API_RATE_LIMIT_EXCEEDED',
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Dépassement du seuil de ${MAX_REQUESTS_PER_WINDOW} requêtes/minute. Accès temporairement bloqué.`,
    });

    res.status(429).json({
      error_fr: "⚠️ Limite de débit API dépassée (Rate Limiter Strict). Veuillez réessayer dans 60 secondes.",
      error_en: "⚠️ API rate limit exceeded. Please try again in 60 seconds.",
      code: 'RATE_LIMIT_EXCEEDED',
    });
    return;
  }

  next();
}

/**
 * Rate limiter dédié aux lancements de scans externes
 */
export function scanRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();

  const record = scanCounts.get(ip);
  if (!record || now >= record.resetTime) {
    scanCounts.set(ip, { count: 1, resetTime: now + SCAN_WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_SCANS_PER_HOUR) {
    generateAuditLog({
      action: 'SCAN_RATE_LIMIT_EXCEEDED',
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Dépassement du quota de ${MAX_SCANS_PER_HOUR} scans externes/heure.`,
    });

    res.status(429).json({
      error_fr: `🛡️ Quota horaire de scans atteint (${MAX_SCANS_PER_HOUR}/h). Passez au plan GARDIEN ou PENTEST PREMIUM pour augmenter vos limites.`,
      error_en: `🛡️ Hourly scan limit reached (${MAX_SCANS_PER_HOUR}/h). Upgrade to GARDIEN or PENTEST PREMIUM.`,
      code: 'SCAN_QUOTA_REACHED',
    });
    return;
  }

  record.count += 1;
  next();
}
