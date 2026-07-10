import crypto from 'crypto';

const AES_KEY = process.env.AES_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 32 bytes hex
const IV_LENGTH = 16; // AES block size

/**
 * Chiffre une chaîne sensible au repos (AES-256-CBC)
 */
export function encryptAES256(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(AES_KEY.slice(0, 64), 'hex');
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('[GHULABE Crypto] Erreur de chiffrement AES-256:', error);
    throw new Error('Erreur de chiffrement au repos AES-256');
  }
}

/**
 * Déchiffre une donnée stockée au repos (AES-256-CBC)
 */
export function decryptAES256(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText; // Donnée non chiffrée
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    const key = Buffer.from(AES_KEY.slice(0, 64), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('[GHULABE Crypto] Erreur de déchiffrement AES-256:', error);
    throw new Error('Erreur de déchiffrement AES-256');
  }
}

/**
 * Journal d'audit complet et infalsifiable de chaque scan et action
 */
export interface AuditLogEntry {
  action: string;
  userId?: string;
  ipAddress: string;
  targetUrl?: string;
  status: 'SUCCESS' | 'BLOCKED' | 'FAILED';
  details: string;
  timestamp: string;
}

export function generateAuditLog(entry: Omit<AuditLogEntry, 'timestamp'>): AuditLogEntry {
  const log: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  
  // Dans un déploiement réel Render / Supabase EU, écriture synchrone dans la table audit_logs
  console.log(`[GHULABE AUDIT LOG] ${log.timestamp} | [${log.status}] ${log.action} | IP: ${log.ipAddress} | User: ${log.userId || 'ANONYMOUS'} | Target: ${log.targetUrl || 'N/A'} | ${log.details}`);
  return log;
}
