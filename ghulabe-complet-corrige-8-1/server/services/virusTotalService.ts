import { generateAuditLog } from '../utils/crypto';

// ============================================================================
// GHULABE — VÉRIFICATION DE RÉPUTATION URL VIA VIRUSTOTAL
// Détecte si un domaine est signalé comme phishing/malveillant par la
// communauté sécurité (60+ moteurs antivirus + listes de blocage).
// Nécessite VIRUSTOTAL_API_KEY. Si absente, la vérification est ignorée
// (jamais de faux résultat simulé).
// ============================================================================

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;

export interface UrlReputationResult {
  checked: boolean;
  malicious: number;
  suspicious: number;
  harmless: number;
  flagged: boolean; // true si malicious > 0 ou suspicious >= 3
}

function toUrlId(url: string): string {
  // VirusTotal identifie une URL par son hash base64 (sans padding) de l'URL complète
  const fullUrl = url.startsWith('http') ? url : `https://${url}`;
  return Buffer.from(fullUrl).toString('base64url').replace(/=+$/, '');
}

export async function checkUrlReputation(
  url: string,
  userId: string,
  ip: string
): Promise<UrlReputationResult> {
  const notChecked: UrlReputationResult = { checked: false, malicious: 0, suspicious: 0, harmless: 0, flagged: false };

  if (!VIRUSTOTAL_API_KEY) {
    generateAuditLog({
      action: 'VIRUSTOTAL_CHECK_SKIPPED',
      userId,
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Vérification VirusTotal ignorée (clé API absente) pour ${url}.`,
    });
    return notChecked;
  }

  try {
    const urlId = toUrlId(url);
    const res = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      method: 'GET',
      headers: { 'x-apikey': VIRUSTOTAL_API_KEY },
    });

    // 404 = URL jamais soumise à VirusTotal auparavant : on la soumet puis on considère
    // qu'aucune donnée n'est encore disponible (l'analyse prend du temps côté VT).
    if (res.status === 404) {
      await fetch('https://www.virustotal.com/api/v3/urls', {
        method: 'POST',
        headers: {
          'x-apikey': VIRUSTOTAL_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ url: url.startsWith('http') ? url : `https://${url}` }),
      });
      generateAuditLog({
        action: 'VIRUSTOTAL_URL_SUBMITTED_NEW',
        userId,
        ipAddress: ip,
        status: 'SUCCESS',
        details: `URL ${url} jamais analysée par VirusTotal, soumission effectuée pour analyse future.`,
      });
      return notChecked;
    }

    if (!res.ok) {
      const errorBody = await res.text();
      generateAuditLog({
        action: 'VIRUSTOTAL_CHECK_FAILED',
        userId,
        ipAddress: ip,
        status: 'FAILED',
        details: `Échec vérification VirusTotal pour ${url} : ${res.status} ${errorBody}`,
      });
      return notChecked;
    }

    const data: any = await res.json();
    const stats = data?.data?.attributes?.last_analysis_stats;
    if (!stats) return notChecked;

    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;
    const harmless = stats.harmless || 0;
    const flagged = malicious > 0 || suspicious >= 3;

    generateAuditLog({
      action: 'VIRUSTOTAL_CHECK_COMPLETED',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `VirusTotal pour ${url} : ${malicious} malveillant(s), ${suspicious} suspect(s), ${harmless} sain(s).`,
    });

    return { checked: true, malicious, suspicious, harmless, flagged };
  } catch (err: any) {
    generateAuditLog({
      action: 'VIRUSTOTAL_CHECK_FAILED',
      userId,
      ipAddress: ip,
      status: 'FAILED',
      details: `Erreur vérification VirusTotal pour ${url} : ${err.message}`,
    });
    return notChecked;
  }
}
