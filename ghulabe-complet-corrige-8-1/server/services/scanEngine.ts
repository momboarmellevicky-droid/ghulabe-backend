import tls from 'tls';
import net from 'net';
import dns from 'dns';
import { generateAuditLog } from '../utils/crypto';

// ============================================================================
// GHULABE — MOTEUR DE SCAN TECHNIQUE RÉEL
// Collecte des faits bruts (headers, SSL, fichiers exposés, ports, DNS mail,
// cookies) sur un domaine cible. Aucune interprétation métier ici : ce module
// ne renvoie que des données factuelles. L'analyse bilingue CEO/dev
// (ceo_impact, financial_risk, etc.) est générée séparément (geminiAnalysis.ts)
// à partir de ces faits.
// ============================================================================

const FETCH_TIMEOUT_MS = 8000;
const TLS_TIMEOUT_MS = 6000;
const PORT_SCAN_TIMEOUT_MS = 2500;

export interface HeadersCheckResult {
  hsts: boolean;
  csp: boolean;
  x_frame_options: boolean;
  x_content_type_options: boolean;
  raw_headers: Record<string, string>;
}

export interface CookieSecurityResult {
  cookies_found: number;
  cookies_missing_secure: string[];
  cookies_missing_httponly: string[];
  cookies_missing_samesite: string[];
}

export interface OpenPort {
  port: number;
  service: string;
}

export interface DnsMailSecurity {
  spf_found: boolean;
  spf_record: string | null;
  dmarc_found: boolean;
  dmarc_record: string | null;
  dmarc_policy: 'none' | 'quarantine' | 'reject' | null;
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
  cookie_security: CookieSecurityResult;
  open_ports: OpenPort[];
  dns_mail_security: DnsMailSecurity;
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
export async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response | null> {
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
 * 1b. Analyse les flags de sécurité des cookies (Secure/HttpOnly/SameSite)
 * à partir des en-têtes Set-Cookie déjà collectés par scanSecurityHeaders.
 */
export function analyzeCookieSecurity(rawHeaders: Record<string, string>): CookieSecurityResult {
  const setCookieHeader = rawHeaders['set-cookie'];
  if (!setCookieHeader) {
    return { cookies_found: 0, cookies_missing_secure: [], cookies_missing_httponly: [], cookies_missing_samesite: [] };
  }

  // fetch() fusionne plusieurs Set-Cookie avec ', ' — on les sépare prudemment
  // (une virgule dans une date d'expiration de cookie ne doit pas casser le split)
  const cookieEntries = setCookieHeader.split(/,(?=\s*[A-Za-z0-9_\-]+=)/);

  const missingSecure: string[] = [];
  const missingHttpOnly: string[] = [];
  const missingSameSite: string[] = [];

  for (const entry of cookieEntries) {
    const name = entry.trim().split('=')[0];
    if (!name) continue;
    const lower = entry.toLowerCase();
    if (!lower.includes('secure')) missingSecure.push(name);
    if (!lower.includes('httponly')) missingHttpOnly.push(name);
    if (!lower.includes('samesite')) missingSameSite.push(name);
  }

  return {
    cookies_found: cookieEntries.length,
    cookies_missing_secure: missingSecure,
    cookies_missing_httponly: missingHttpOnly,
    cookies_missing_samesite: missingSameSite,
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
            issuer: String(cert.issuer?.O ?? cert.issuer?.CN ?? 'Émetteur inconnu'),});
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
 * 3. Vérifie la présence de fichiers/chemins sensibles exposés publiquement.
 * Liste étendue (config, backups, VCS, identifiants cloud, logs) plutôt que
 * les 5 chemins historiques — augmente sensiblement les chances de détecter
 * une vraie fuite de configuration.
 */
export async function scanExposedFiles(hostname: string): Promise<string[]> {
  const filesToCheck = [
    '.env', '.env.local', '.env.production',
    '.git/config', '.git/HEAD',
    'config.php.bak', 'wp-config.php.bak', 'wp-config.php.old',
    '.DS_Store', '.htaccess', '.htpasswd',
    'backup.zip', 'backup.sql', 'database.sql', 'dump.sql',
    '.aws/credentials', 'credentials.json',
    'composer.json', 'package.json.bak',
    'phpinfo.php', 'info.php', 'test.php',
    'server-status', 'error_log', 'debug.log',
    '.vscode/sftp.json', 'id_rsa', '.ssh/id_rsa',
    'admin/config.php', 'web.config.bak',
  ];
  const exposed: string[] = [];

  // Détection des faux positifs causés par les sites SPA (React/Vue/Angular)
  // configurés avec une règle de redirection catch-all (ex: /* → /index.html
  // sur Render, Netlify, Vercel) : dans ce cas, TOUTE URL renvoie 200 avec le
  // contenu de la page d'accueil, y compris une URL totalement inventée —
  // donc chaque "fichier sensible" testé serait signalé à tort comme exposé.
  // On teste d'abord une URL aléatoire garantie inexistante : si elle répond
  // 200 elle aussi, on compare le corps de chaque fichier testé au corps de
  // cette URL témoin, et on ignore les correspondances identiques (30 août
  // 2026, faux positif confirmé sur un site React généré par MÉNU : 23
  // "fichiers exposés" qui n'étaient en réalité que la page d'accueil).
  const canaryPath = `ghulabe-canary-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const canaryRes = await fetchWithTimeout(`https://${hostname}/${canaryPath}`, FETCH_TIMEOUT_MS);
  const canaryBody = canaryRes && canaryRes.status === 200 ? await canaryRes.text().catch(() => null) : null;
  const isSpaFallbackSuspected = canaryRes !== null && canaryRes.status === 200;

  const checks = filesToCheck.map(async (file) => {
    const res = await fetchWithTimeout(`https://${hostname}/${file}`, FETCH_TIMEOUT_MS);
    // On ne considère exposé que les réponses 200 avec un minimum de contenu
    // (évite les faux positifs des pages d'erreur 200 génériques)
    if (res && res.status === 200) {
      const contentLength = res.headers.get('content-length');
      if (!contentLength || parseInt(contentLength, 10) > 0) {
        if (isSpaFallbackSuspected && canaryBody !== null) {
          const fileBody = await res.text().catch(() => null);
          // Corps identique à la page témoin inexistante = faux positif SPA,
          // on ignore ce résultat plutôt que de signaler un fichier fantôme.
          if (fileBody === canaryBody) return;
        }
        exposed.push(file);
      }
    }
  });

  await Promise.allSettled(checks);
  return exposed;
}

/**
 * 4. Scan des ports TCP courants (connexion directe, pas de dépendance nmap).
 * Détecte les services exposés par erreur au-delà du 443 web standard :
 * bases de données, SSH mal configuré, ports d'administration oubliés.
 */
const COMMON_PORTS: { port: number; service: string }[] = [
  { port: 21, service: 'FTP' },
  { port: 22, service: 'SSH' },
  { port: 23, service: 'Telnet' },
  { port: 25, service: 'SMTP' },
  { port: 3306, service: 'MySQL' },
  { port: 5432, service: 'PostgreSQL' },
  { port: 6379, service: 'Redis' },
  { port: 27017, service: 'MongoDB' },
  { port: 3389, service: 'RDP' },
  { port: 8080, service: 'HTTP-Alt/Admin' },
  { port: 9200, service: 'Elasticsearch' },
];

function checkPort(hostname: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    const finish = (open: boolean) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve(open);
    };

    socket.setTimeout(PORT_SCAN_TIMEOUT_MS);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));

    socket.connect(port, hostname);
  });
}

// Port de contrôle improbable : sert à détecter une infrastructure partagée
// (ex: proxy/edge Render) qui accepte la poignée de main TCP sur des ports
// non réellement liés au service, ce qui donnerait de faux positifs.
const CONTROL_PORT = 54329;

export async function scanCommonPorts(hostname: string): Promise<OpenPort[]> {
  // Render (*.onrender.com) ne route publiquement que 80/443 quel que soit
  // le port interne de l'app (PORT env var) : un port "ouvert" détecté sur
  // ce type d'hôte reflète l'infrastructure partagée de Render, pas une
  // mauvaise configuration du client. On ignore le scan de ports pour ces
  // hôtes afin d'éviter les faux positifs non actionnables.
  if (hostname.endsWith('.onrender.com')) {
    return [];
  }

  const controlOpen = await checkPort(hostname, CONTROL_PORT);

  if (controlOpen) {
    // L'hôte répond "ouvert" même sur un port de contrôle improbable :
    // signal non fiable, on ne remonte aucun port pour éviter les faux positifs.
    return [];
  }

  const results = await Promise.allSettled(
    COMMON_PORTS.map(async ({ port, service }) => ({ port, service, open: await checkPort(hostname, port) }))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<{ port: number; service: string; open: boolean }> => r.status === 'fulfilled' && r.value.open)
    .map((r) => ({ port: r.value.port, service: r.value.service }));
}

/**
 * 5. Vérifie la sécurité email du domaine (protection anti-spoofing) :
 * enregistrement SPF et politique DMARC. Point souvent négligé par les PME
 * et très concret pour un CEO (usurpation d'email, phishing sous son nom).
 */
function resolveTxtSafe(hostname: string): Promise<string[][]> {
  return new Promise((resolve) => {
    dns.resolveTxt(hostname, (err, records) => {
      if (err) resolve([]);
      else resolve(records);
    });
  });
}

export async function scanDnsMailSecurity(hostname: string): Promise<DnsMailSecurity> {
  const [spfRecords, dmarcRecords] = await Promise.all([
    resolveTxtSafe(hostname),
    resolveTxtSafe(`_dmarc.${hostname}`),
  ]);

  const spfFlat = spfRecords.map((r) => r.join('')).find((r) => r.toLowerCase().startsWith('v=spf1'));
  const dmarcFlat = dmarcRecords.map((r) => r.join('')).find((r) => r.toLowerCase().startsWith('v=dmarc1'));

  let dmarcPolicy: 'none' | 'quarantine' | 'reject' | null = null;
  if (dmarcFlat) {
    const match = dmarcFlat.match(/p=(none|quarantine|reject)/i);
    if (match) dmarcPolicy = match[1].toLowerCase() as 'none' | 'quarantine' | 'reject';
  }

  return {
    spf_found: !!spfFlat,
    spf_record: spfFlat || null,
    dmarc_found: !!dmarcFlat,
    dmarc_record: dmarcFlat || null,
    dmarc_policy: dmarcPolicy,
  };
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

  const [headersResult, sslResult, exposedResult, portsResult, dnsMailResult] = await Promise.allSettled([
    scanSecurityHeaders(hostname),
    scanSSLCertificate(hostname),
    scanExposedFiles(hostname),
    scanCommonPorts(hostname),
    scanDnsMailSecurity(hostname),
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

  const open_ports: OpenPort[] = portsResult.status === 'fulfilled' ? portsResult.value : [];

  const dns_mail_security: DnsMailSecurity =
    dnsMailResult.status === 'fulfilled'
      ? dnsMailResult.value
      : { spf_found: false, spf_record: null, dmarc_found: false, dmarc_record: null, dmarc_policy: null };

  const cookie_security = analyzeCookieSecurity(headers_checked.raw_headers);

  const reachable = headersResult.status === 'fulfilled' && Object.keys(headers_checked.raw_headers).length > 0;

  const duration_ms = Date.now() - startedAt;

  generateAuditLog({
    action: 'SCAN_ENGINE_COMPLETED',
    userId,
    ipAddress: ip,
    targetUrl: hostname,
    status: 'SUCCESS',
    details: `Scan technique terminé en ${duration_ms}ms. Joignable: ${reachable}. Fichiers exposés: ${exposed_files.length}. Ports ouverts: ${open_ports.length}. SPF: ${dns_mail_security.spf_found}. DMARC: ${dns_mail_security.dmarc_found}.`,
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
    cookie_security,
    open_ports,
    dns_mail_security,
  };
}

// ============================================================================
// GHULABE — HEARTBEAT RAPIDE (surveillance rapprochée, plan Gardien)
// Contrairement à runFullScan (25 fichiers + 11 ports + DNS mail, coûteux,
// gardé en cadence hebdomadaire), le heartbeat est volontairement léger pour
// pouvoir tourner toutes les 15-30 minutes sans surcharger le moteur ni les
// domaines cibles : uptime, validité du certificat SSL, et empreinte du
// contenu de la page d'accueil pour détecter un défacement (piratage visible)
// bien plus vite qu'un scan hebdomadaire ne le permettrait.
// ============================================================================

import crypto from 'crypto';

export interface HeartbeatResult {
  hostname: string;
  checked_at: string;
  is_online: boolean;
  http_status: number | null;
  response_time_ms: number | null;
  ssl_valid: boolean;
  ssl_expires_in_days: number | null;
  content_hash: string | null;
}

/**
 * Calcule une empreinte SHA-256 du contenu HTML de la page d'accueil.
 * Une variation brutale entre deux checks (hash différent) est un signal
 * classique de défacement (remplacement de contenu suite à intrusion) ou
 * d'injection malveillante (redirection, script inséré).
 */
function hashContent(html: string): string {
  return crypto.createHash('sha256').update(html).digest('hex');
}

export async function runQuickHeartbeat(hostname: string): Promise<HeartbeatResult> {
  const checked_at = new Date().toISOString();
  const startedAt = Date.now();

  const [pageResult, sslResult] = await Promise.allSettled([
    fetchWithTimeout(`https://${hostname}`, 6000),
    scanSSLCertificate(hostname),
  ]);

  const response_time_ms = Date.now() - startedAt;

  let is_online = false;
  let http_status: number | null = null;
  let content_hash: string | null = null;

  if (pageResult.status === 'fulfilled' && pageResult.value) {
    is_online = true;
    http_status = pageResult.value.status;
    try {
      const html = await pageResult.value.text();
      content_hash = hashContent(html);
    } catch {
      content_hash = null;
    }
  }

  const ssl_valid = sslResult.status === 'fulfilled' ? sslResult.value.valid : false;
  const ssl_expires_in_days = sslResult.status === 'fulfilled' ? sslResult.value.expires_in_days : null;

  return {
    hostname,
    checked_at,
    is_online,
    http_status,
    response_time_ms: is_online ? response_time_ms : null,
    ssl_valid,
    ssl_expires_in_days,
    content_hash,
  };
}
