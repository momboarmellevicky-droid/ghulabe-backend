import { Request, Response, NextFunction } from 'express';
import { generateAuditLog } from '../utils/crypto';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'user' | 'dev' | 'admin';
  plan: 'gratuit' | 'gardien' | 'pentest_premium';
  is2faVerified: boolean;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Vérification du token JWT avec expiration stricte (24h)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error_fr: "🔒 Accès non autorisé : Token JWT manquant ou invalide.",
      error_en: "🔒 Unauthorized: Missing or invalid JWT token.",
      code: 'UNAUTHORIZED_NO_TOKEN',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  const result = verifyAccessToken(token);

  if (!result.valid) {
    if (result.reason === 'EXPIRED') {
      generateAuditLog({
        action: 'JWT_EXPIRED_ATTEMPT',
        ipAddress: ip,
        status: 'BLOCKED',
        details: 'Tentative d\'accès avec un JWT expiré (> 24h).',
      });

      res.status(401).json({
        error_fr: "⌛ Token JWT expiré (limite stricte 24h). Veuillez vous reconnecter et valider le 2FA.",
        error_en: "⌛ JWT token expired (24h limit). Please log in again.",
        code: 'JWT_EXPIRED',
      });
      return;
    }

    generateAuditLog({
      action: 'INVALID_JWT_SIGNATURE_ATTEMPT',
      ipAddress: ip,
      status: 'BLOCKED',
      details: 'Tentative d\'accès avec une signature JWT invalide ou un token malformé.',
    });

    res.status(401).json({
      error_fr: "🔒 Échec de validation cryptographique du jeton JWT.",
      error_en: "🔒 JWT signature verification failed.",
      code: 'INVALID_JWT_SIGNATURE',
    });
    return;
  }

  req.user = result.payload;
  next();
}

/**
 * Authentification optionnelle : si un Bearer token valide est présent, peuple req.user
 * (comme requireAuth). Sinon, laisse passer sans erreur — utilisé sur les routes qui doivent
 * rester accessibles en anonyme (scan gratuit) tout en reconnaissant un utilisateur connecté
 * quand il l'est (ex: /scan/start doit générer et lier le rapport PDF si l'appelant est identifié).
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];
  const result = verifyAccessToken(token);

  if (result.valid) {
    req.user = result.payload;
  }
  // Token absent, expiré ou invalide : on ne bloque jamais ici, le scan reste utilisable
  // en mode anonyme (req.user restera undefined, comportement identique à avant).

  next();
}

/**
 * Exige impérativement le 2FA validé pour les routes développeurs certifiés et administrateurs
 */
export function require2FA(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!req.user || !req.user.is2faVerified) {
    generateAuditLog({
      action: 'MISSING_2FA_ATTEMPT',
      userId: req.user?.id,
      ipAddress: ip,
      status: 'BLOCKED',
      details: 'Accès refusé : Authentification 2FA obligatoire pour ce rôle/endpoint.',
    });

    res.status(403).json({
      error_fr: "🛡️ Accès restreint : Validation 2FA obligatoire pour les développeurs et administrateurs GHULABE.",
      error_en: "🛡️ Restricted access: Mandatory 2FA verification required.",
      code: 'MANDATORY_2FA_REQUIRED',
    });
    return;
  }

  next();
}

/**
 * Exige le rôle administrateur (Mombo Armelle Vicky)
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      error_fr: "⛔ Accès interdit : Réservé exclusivement à Mombo Armelle Vicky (Direction GHULABE).",
      error_en: "⛔ Forbidden: Reserved exclusively for Mombo Armelle Vicky.",
      code: 'FORBIDDEN_ADMIN_ONLY',
    });
    return;
  }
  next();
}
