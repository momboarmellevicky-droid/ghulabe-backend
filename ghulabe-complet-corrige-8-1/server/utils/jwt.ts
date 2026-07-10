import jwt from 'jsonwebtoken';

// ============================================================================
// GHULABE — GESTION JWT RÉELLE
// Remplace la simulation de signature/vérification par de vrais tokens
// signés HMAC-SHA256, avec expiration stricte et issuer vérifié.
// ============================================================================

export interface JwtPayload {
  id: string;
  email: string;
  role: 'user' | 'dev' | 'admin';
  plan: 'gratuit' | 'gardien' | 'pentest_premium';
  is2faVerified: boolean;
}

export interface DecodedJwtPayload extends JwtPayload {
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'ghulabe_super_secret_jwt_key_2026_master_pme_africa';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_ISSUER = process.env.JWT_ISSUER || 'ghulabe.com';

/**
 * Signe un nouveau token JWT (émis après validation du 2FA)
 */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: JWT_ISSUER,
  } as jwt.SignOptions);
}

export type VerifiedTokenResult =
  | { valid: true; payload: DecodedJwtPayload }
  | { valid: false; reason: 'EXPIRED' | 'INVALID' };

/**
 * Vérifie un token JWT reçu dans l'en-tête Authorization.
 * Distingue explicitement expiration (EXPIRED) et signature invalide (INVALID)
 * pour conserver les mêmes codes d'erreur bilingues déjà utilisés par authMiddleware.ts.
 */
export function verifyAccessToken(token: string): VerifiedTokenResult {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER }) as DecodedJwtPayload;
    return { valid: true, payload: decoded };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { valid: false, reason: 'EXPIRED' };
    }
    return { valid: false, reason: 'INVALID' };
  }
}

export { JWT_EXPIRES_IN };
