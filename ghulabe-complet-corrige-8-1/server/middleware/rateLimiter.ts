import { Request, Response, NextFunction } from 'express';
import { generateAuditLog } from '../utils/crypto';
import { supabaseAdmin } from '../config/supabase';

// Rate limiting persistant via Supabase (table rate_limits + fonction RPC increment_rate_limit).
// Remplace l'ancien cache en mémoire (Map) qui se réinitialisait à chaque redéploiement Render.
// En cas d'erreur Supabase (ex. panne réseau), le limiteur "fail open" : la requête passe et
// l'incident est loggé, pour ne jamais bloquer le service à cause d'un souci de rate limiting.

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // Strict : 100 requêtes / min

const SCAN_WINDOW_MS = 60 * 60 * 1000; // 1 heure
const MAX_SCANS_PER_HOUR = 10; // Strict : 10 scans / heure par IP

interface RateLimitCheckResult {
  count: number;
  window_end: string;
}

async function checkRateLimit(limiterKey: string, windowMs: number): Promise<RateLimitCheckResult | null> {
  const { data, error } = await supabaseAdmin.rpc('increment_rate_limit', {
    p_key: limiterKey,
    p_window_ms: windowMs,
    p_now: new Date().toISOString(),
  });

  if (error) {
    console.error('[RateLimiter] Erreur Supabase (fail-open, requête autorisée) :', error.message);
    return null;
  }

  return Array.isArray(data) ? data[0] : data;
}

/**
 * Rate limiter strict sur toutes les routes API
 */
export async function apiRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const result = await checkRateLimit(`api:${ip}`, RATE_LIMIT_WINDOW_MS);

  if (!result) {
    next();
    return;
  }

  if (result.count > MAX_REQUESTS_PER_WINDOW) {
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
export async function scanRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const result = await checkRateLimit(`scan:${ip}`, SCAN_WINDOW_MS);

  if (!result) {
    next();
    return;
  }

  if (result.count > MAX_SCANS_PER_HOUR) {
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

  next();
}
