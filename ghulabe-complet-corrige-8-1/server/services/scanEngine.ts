import tls from 'tls';
import { generateAuditLog } from '../utils/crypto';

// ============================================================================
// GHULABE — MOTEUR DE SCAN TECHNIQUE RÉEL
// Collecte des faits bruts (headers, SSL, fichiers exposés) sur un domaine cible.
// Aucune interprétation métier ici : ce module ne renvoie que des données
// factuelles. L'analyse bilingue CEO/dev (ceo_impact, financial_risk, etc.)
// sera générée séparément (étape suivante : geminiAnalysis.ts) à partir de
// ces faits.
// ============================================================================

const FETCH_TIMEOUT_MS = 8000;
const TLS_TIMEOUT_MS = 6000;

export interface HeadersCheckResult {
  hsts: boolean;
  csp: boolean;
  x_frame_options: boolean;
  x_content_type_options: boolean;
  raw_headers: Record<string, string>;
}

export interface SSLStatus {
  valid: boolean;
  expires_in_days: number;
  issuer: string;
  error?: string;
}

export interface RawScanFacts {
  url: string;
  hostname: string;
  scanned_at: string;
  duration_ms: number;
  headers_checked: HeadersCheckResult;
  ssl_status: SSLStatus;
  exposed_files: string[];
  reachable: boolean;
}

/**
 * Normalise l'URL fournie par l'utilisateur en nom d'hôte propre.
 * (cleanUrl équivalent à celui déjà utilisé dans scanController.ts)
 */
function normalizeHostname(url: string): string {
  return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].trim();
}

/**
 * Effectue un fetch avec timeout strict (protection contre les cibles lentes/hostiles)
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'GHULABE-SecurityScanner/1.0 (+https://ghulabe.com)' },
    });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 1. Vérifie les en-têtes de sécurité HTTP standards (OWASP Secure Headers)
 */
export async function scanSecurityHeaders(hostname: string): Promise<HeadersCheckResult> {
  const res = await fetchWithTimeout(`https://${hostname}`, FETCH_TIMEOUT_MS);

  if (!res) {
    return {
      hsts: false,
      csp: false,
      x_frame_options: false,
      x_content_type_options: false,
      raw_headers: {},
    };
  }

  const raw_headers: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    raw_headers[key.toLowerCase()] = value;
  });

  return {
    hsts: raw_headers['strict-transport-security'] !== undefined,
    csp: raw_headers['content-security-policy'] !== undefined,
    x_frame_options: raw_headers['x-frame-options'] !== undefined,
    x_content_type_options: raw_headers['x-content-type-options'] !== undefined,
    raw_headers,
  };
}

/**
 * 2. Vérifie le certificat SSL/TLS directement (connexion TLS native, rapide,
 * sans dépendre de l'API externe SSL Labs qui peut prendre plusieurs minutes
 * et ne respecterait pas la contrainte GHULABE < 60 secondes/scan)
 */
export async function scanSSLCertificate(hostname: string): Promise<SSLStatus> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: hostname,
        port: 443,
        servername: hostname,
        timeout: TLS_TIMEOUT_MS,
        rejectUnauthorized: false, // on veut inspecter même un certificat invalide, pas le rejeter silencieusement
      },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          const authorized = socket.authorized;

          if (!cert || Object.keys(cert).length === 0) {
            resolve({ valid: false, expires_in_days: 0, issuer: 'Inconnu', error: 'Certificat introuvable' });
            socket.end();
            return;
          }

          const expiresAt = new Date(cert.valid_to);
          const expiresInDays = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

          resolve({
            valid: authorized && expiresInDays > 0,
            expires_in_days: expiresInDays,
            issuer: String(cert.issuer?.O ?? cert.issuer?.CN ?? 'Émetteur inconnu'),
        } catch (err: any) {
          resolve({ valid: false, expires_in_days: 0, issuer: 'Inconnu', error: err.message });
        } finally {
          socket.end();
        }
      }
    );

    socket.on('error', (err: Error) => {
      resolve({ valid: false, expires_in_days: 0, issuer: 'Inconnu', error: err.message });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ valid: false, expires_in_days: 0, issuer: 'Inconnu', error: 'Timeout de connexion TLS' });
    });
  });
}

/**
 * 3. Vérifie la présence de fichiers sensibles exposés publiquement
 */
export async function scanExposedFiles(hostname: string): Promise<string[]> {
  const filesToCheck = ['.env', '.git/config', 'config.php.bak', 'wp-config.php.bak', '.DS_Store'];
  const exposed: string[] = [];

  const checks = filesToCheck.map(async (file) => {
    const res = await fetchWithTimeout(`https://${hostname}/${file}`, FETCH_TIMEOUT_MS);
    // On ne considère exposé que les réponses 200 avec un minimum de contenu
    // (évite les faux positifs des pages d'erreur 200 génériques)
    if (res && res.status === 200) {
      const contentLength = res.headers.get('content-length');
      if (!contentLength || parseInt(contentLength, 10) > 0) {
        exposed.push(file);
      }
    }
  });

  await Promise.allSettled(checks);
  return exposed;
}

/**
 * Orchestrateur principal : lance les 3 vérifications en parallèle
 * et renvoie les faits bruts, sans aucune interprétation métier.
 */
export async function runFullScan(url: string, userId: string, ip: string): Promise<RawScanFacts> {
  const hostname = normalizeHostname(url);
  const startedAt = Date.now();

  generateAuditLog({
    action: 'SCAN_ENGINE_STARTED',
    userId,
    ipAddress: ip,
    targetUrl: hostname,
    status: 'SUCCESS',
    details: 'Lancement du moteur de scan réel (headers + SSL + fichiers exposés).',
  });

  const [headersResult, sslResult, exposedResult] = await Promise.allSettled([
    scanSecurityHeaders(hostname),
    scanSSLCertificate(hostname),
    scanExposedFiles(hostname),
  ]);

  const headers_checked: HeadersCheckResult =
    headersResult.status === 'fulfilled'
      ? headersResult.value
      : { hsts: false, csp: false, x_frame_options: false, x_content_type_options: false, raw_headers: {} };

  const ssl_status: SSLStatus =
    sslResult.status === 'fulfilled'
      ? sslResult.value
      : { valid: false, expires_in_days: 0, issuer: 'Inconnu', error: 'Erreur interne du moteur de scan' };

  const exposed_files: string[] = exposedResult.status === 'fulfilled' ? exposedResult.value : [];

  const reachable = headersResult.status === 'fulfilled' && Object.keys(headers_checked.raw_headers).length > 0;

  const duration_ms = Date.now() - startedAt;

  generateAuditLog({
    action: 'SCAN_ENGINE_COMPLETED',
    userId,
    ipAddress: ip,
    targetUrl: hostname,
    status: 'SUCCESS',
    details: `Scan technique terminé en ${duration_ms}ms. Joignable: ${reachable}. Fichiers exposés: ${exposed_files.length}.`,
  });

  return {
    url,
    hostname,
    scanned_at: new Date().toISOString(),
    duration_ms,
    headers_checked,
    ssl_status,
    exposed_files,
    reachable,
  };
}
