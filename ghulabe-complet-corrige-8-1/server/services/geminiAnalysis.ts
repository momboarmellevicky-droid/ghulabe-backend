import { generateAuditLog } from '../utils/crypto';
import type { RawScanFacts } from './scanEngine';

// ============================================================================
// GHULABE — ANALYSE IA DES RÉSULTATS DE SCAN (GEMINI)
// Prend les faits bruts collectés par scanEngine.ts (headers, SSL, fichiers
// exposés) et les transforme en verdicts bilingues FR/EN exploitables par
// l'interface (impact CEO, risque financier, urgence, code de remédiation).
// Gemini n'effectue AUCUNE requête réseau vers la cible : il ne fait
// qu'interpréter des données déjà collectées par le vrai moteur de scan.
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const GEMINI_TIMEOUT_MS = 20000;

// Reproduit volontairement la forme de VulnerabilityFinding (src/types.ts)
// sans importer depuis src/ : le backend server/ reste un module TypeScript
// isolé, avec son propre tsconfig et sa propre compilation.
export interface VulnerabilityFinding {
  id: string;
  title_fr: string;
  title_en: string;
  severity: 'critique' | 'eleve' | 'moyen' | 'faible';
  category: string;
  cve_id?: string;
  ceo_impact_fr: string;
  ceo_impact_en: string;
  financial_risk_fr: string;
  financial_risk_en: string;
  urgency_fr: string;
  urgency_en: string;
  tech_details_fr: string;
  tech_details_en: string;
  remediation_code: string;
  remediation_lang: string;
}

const RESPONSE_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      title_fr: { type: 'STRING' },
      title_en: { type: 'STRING' },
      severity: { type: 'STRING', enum: ['critique', 'eleve', 'moyen', 'faible'] },
      category: { type: 'STRING' },
      cve_id: { type: 'STRING' },
      ceo_impact_fr: { type: 'STRING' },
      ceo_impact_en: { type: 'STRING' },
      financial_risk_fr: { type: 'STRING' },
      financial_risk_en: { type: 'STRING' },
      urgency_fr: { type: 'STRING' },
      urgency_en: { type: 'STRING' },
      tech_details_fr: { type: 'STRING' },
      tech_details_en: { type: 'STRING' },
      remediation_code: { type: 'STRING' },
      remediation_lang: { type: 'STRING' },
    },
    required: [
      'title_fr', 'title_en', 'severity', 'category',
      'ceo_impact_fr', 'ceo_impact_en',
      'financial_risk_fr', 'financial_risk_en',
      'urgency_fr', 'urgency_en',
      'tech_details_fr', 'tech_details_en',
      'remediation_code', 'remediation_lang',
    ],
  },
};

const SYSTEM_INSTRUCTION = `Tu es le moteur d'analyse de GHULABE, une plateforme de cybersécurité bilingue (français/anglais) pour PME africaines.
On te fournit des FAITS TECHNIQUES BRUTS déjà collectés par un vrai scanner (pas à toi de deviner ou d'inventer des faits).
Ta seule tâche : transformer chaque problème détecté en une entrée bilingue destinée à deux publics différents :
- Un dirigeant non-technique (ceo_impact, financial_risk, urgency) : langage clair, impact business concret, aucun jargon.
- Un développeur (tech_details, remediation_code) : précis, actionnable, avec un exemple de correction réaliste.
Règles strictes :
- N'invente jamais de faille qui ne découle pas des faits fournis.
- Si aucun problème n'est détecté dans les faits, renvoie un tableau vide [].
- Les montants de risque financier doivent être exprimés en FCFA, de façon réaliste et prudente.
- Réponds UNIQUEMENT avec un objet JSON de la forme {"findings": [...]}, sans texte autour.`;

function buildUserPrompt(facts: RawScanFacts): string {
  const lines: string[] = [
    `Domaine analysé : ${facts.hostname}`,
    `Joignable en HTTPS : ${facts.reachable ? 'oui' : 'non'}`,
    '',
    '--- En-têtes de sécurité HTTP ---',
    `HSTS (Strict-Transport-Security) : ${facts.headers_checked.hsts ? 'présent' : 'ABSENT'}`,
    `CSP (Content-Security-Policy) : ${facts.headers_checked.csp ? 'présent' : 'ABSENT'}`,
    `X-Frame-Options : ${facts.headers_checked.x_frame_options ? 'présent' : 'ABSENT'}`,
    `X-Content-Type-Options : ${facts.headers_checked.x_content_type_options ? 'présent' : 'ABSENT'}`,
    '',
    '--- Certificat SSL/TLS ---',
    `Valide : ${facts.ssl_status.valid ? 'oui' : 'non'}`,
    `Expire dans : ${facts.ssl_status.expires_in_days} jour(s)`,
    `Émetteur : ${facts.ssl_status.issuer}`,
    facts.ssl_status.error ? `Erreur : ${facts.ssl_status.error}` : '',
    '',
    '--- Fichiers sensibles exposés publiquement ---',
    facts.exposed_files.length > 0 ? facts.exposed_files.join(', ') : 'Aucun fichier sensible détecté',
    '',
    '--- Ports réseau ouverts détectés (au-delà du 443 web standard) ---',
    facts.open_ports.length > 0
      ? facts.open_ports.map((p) => `${p.port} (${p.service})`).join(', ')
      : 'Aucun port sensible ouvert détecté',
    '',
    '--- Sécurité email du domaine (anti-usurpation) ---',
    `SPF configuré : ${facts.dns_mail_security.spf_found ? 'oui — ' + facts.dns_mail_security.spf_record : 'ABSENT'}`,
    `DMARC configuré : ${facts.dns_mail_security.dmarc_found ? 'oui — politique: ' + facts.dns_mail_security.dmarc_policy : 'ABSENT'}`,
    '',
    '--- Sécurité des cookies ---',
    facts.cookie_security.cookies_found === 0
      ? 'Aucun cookie observé sur cette page'
      : [
          `${facts.cookie_security.cookies_found} cookie(s) détecté(s)`,
          facts.cookie_security.cookies_missing_secure.length > 0 ? `Sans flag Secure : ${facts.cookie_security.cookies_missing_secure.join(', ')}` : '',
          facts.cookie_security.cookies_missing_httponly.length > 0 ? `Sans flag HttpOnly : ${facts.cookie_security.cookies_missing_httponly.join(', ')}` : '',
          facts.cookie_security.cookies_missing_samesite.length > 0 ? `Sans flag SameSite : ${facts.cookie_security.cookies_missing_samesite.join(', ')}` : '',
        ].filter(Boolean).join(' | '),
  ];

  return lines.filter(Boolean).join('\n');
}

/**
 * Répare les réponses JSON de Gemini qui seraient entourées de balises
 * markdown (```json ... ```), au cas où le modèle ne respecte pas le mode
 * JSON strict.
 */
function extractJsonArray(rawText: string): unknown {
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Complète les champs générés par Gemini avec les métadonnées manquantes
 * (id unique, cve_id par défaut) pour obtenir un VulnerabilityFinding complet.
 */
function toFullFinding(partial: any, index: number): VulnerabilityFinding {
  return {
    id: `f-${Date.now()}-${index}`,
    title_fr: partial.title_fr,
    title_en: partial.title_en,
    severity: partial.severity,
    category: partial.category,
    cve_id: partial.cve_id || undefined,
    ceo_impact_fr: partial.ceo_impact_fr,
    ceo_impact_en: partial.ceo_impact_en,
    financial_risk_fr: partial.financial_risk_fr,
    financial_risk_en: partial.financial_risk_en,
    urgency_fr: partial.urgency_fr,
    urgency_en: partial.urgency_en,
    tech_details_fr: partial.tech_details_fr,
    tech_details_en: partial.tech_details_en,
    remediation_code: partial.remediation_code,
    remediation_lang: partial.remediation_lang,
  };
}

/**
 * Appelle Gemini pour transformer les faits bruts d'un scan en verdicts
 * bilingues exploitables par l'interface GHULABE.
 * En cas d'échec (clé manquante, quota, timeout, JSON invalide), renvoie un
 * tableau vide plutôt que de faire planter le scan complet : le score et les
 * données techniques brutes restent affichables même sans l'analyse IA.
 */
export async function generateFindingsFromScan(
  facts: RawScanFacts,
  userId: string,
  ip: string
): Promise<VulnerabilityFinding[]> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    generateAuditLog({
      action: 'GEMINI_ANALYSIS_SKIPPED',
      userId,
      ipAddress: ip,
      targetUrl: facts.hostname,
      status: 'BLOCKED',
      details: 'GROQ_API_KEY absente de la configuration serveur (.env). Analyse IA ignorée.',
    });
    return [];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: buildUserPrompt(facts) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Groq API a répondu ${res.status} : ${errBody.slice(0, 300)}`);
    }

    const data: any = await res.json();
    const rawText: string | undefined = data?.choices?.[0]?.message?.content;

    if (!rawText) {
      throw new Error('Réponse Groq vide ou mal formée.');
    }

    const parsedRoot = extractJsonArray(rawText) as any;
    const parsed = Array.isArray(parsedRoot) ? parsedRoot : parsedRoot?.findings;
    if (!Array.isArray(parsed)) {
      throw new Error('La réponse Groq ne contient pas un tableau JSON.');
    }

    const findings = parsed.map((item, index) => toFullFinding(item, index));

    generateAuditLog({
      action: 'GEMINI_ANALYSIS_COMPLETED',
      userId,
      ipAddress: ip,
      targetUrl: facts.hostname,
      status: 'SUCCESS',
      details: `Analyse IA terminée : ${findings.length} verdict(s) généré(s) à partir des faits réels.`,
    });

    return findings;
  } catch (err: any) {
    generateAuditLog({
      action: 'GEMINI_ANALYSIS_FAILED',
      userId,
      ipAddress: ip,
      targetUrl: facts.hostname,
      status: 'FAILED',
      details: `Échec de l'analyse IA Gemini : ${err.message}. Le scan continue sans verdicts enrichis.`,
    });
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Génère des failles de base directement à partir des faits bruts (sans IA).
 * Garantit que le rapport n'est JAMAIS vide/contradictoire avec le score
 * quand des problèmes réels existent, même si Groq est indisponible (clé
 * manquante, quota, timeout, panne). Ces verdicts sont plus sommaires que
 * ceux générés par l'IA, mais restent 100% exacts car dérivés des faits
 * techniques constatés, pas d'un texte généré.
 */
export function generateDeterministicFindings(facts: RawScanFacts): VulnerabilityFinding[] {
  const findings: VulnerabilityFinding[] = [];
  let idx = 0;
  const next = () => `f-fallback-${Date.now()}-${idx++}`;

  if (!facts.ssl_status.valid) {
    findings.push({
      id: next(),
      title_fr: 'Certificat SSL/TLS invalide ou absent',
      title_en: 'Invalid or missing SSL/TLS certificate',
      severity: 'critique',
      category: 'Chiffrement',
      ceo_impact_fr: 'Les visiteurs voient un avertissement de sécurité dans leur navigateur, ce qui nuit gravement à la confiance et peut faire fuir des clients.',
      ceo_impact_en: 'Visitors see a security warning in their browser, seriously harming trust and potentially driving customers away.',
      financial_risk_fr: 'Perte de trafic et de conversions ; risque de sanction pour non-conformité RGPD/données.',
      financial_risk_en: 'Loss of traffic and conversions; risk of GDPR/data compliance penalties.',
      urgency_fr: 'Immédiate',
      urgency_en: 'Immediate',
      tech_details_fr: `Certificat invalide (émetteur: ${facts.ssl_status.issuer}). ${facts.ssl_status.error || ''}`.trim(),
      tech_details_en: `Invalid certificate (issuer: ${facts.ssl_status.issuer}). ${facts.ssl_status.error || ''}`.trim(),
      remediation_code: 'Installer un certificat SSL/TLS valide (ex: Let\'s Encrypt, gratuit et automatisable).',
      remediation_lang: 'texte',
    });
  }

  const missingHeaders: { key: keyof RawScanFacts['headers_checked']; label_fr: string; label_en: string }[] = [
    { key: 'hsts', label_fr: 'Strict-Transport-Security (HSTS)', label_en: 'Strict-Transport-Security (HSTS)' },
    { key: 'csp', label_fr: 'Content-Security-Policy (CSP)', label_en: 'Content-Security-Policy (CSP)' },
    { key: 'x_frame_options', label_fr: 'X-Frame-Options', label_en: 'X-Frame-Options' },
    { key: 'x_content_type_options', label_fr: 'X-Content-Type-Options', label_en: 'X-Content-Type-Options' },
  ];
  const missing = missingHeaders.filter((h) => !facts.headers_checked[h.key]);
  if (missing.length > 0) {
    findings.push({
      id: next(),
      title_fr: `${missing.length} en-tête(s) de sécurité HTTP manquant(s)`,
      title_en: `${missing.length} missing HTTP security header(s)`,
      severity: missing.length >= 3 ? 'eleve' : 'moyen',
      category: 'Configuration serveur',
      ceo_impact_fr: 'Le site est plus vulnérable aux attaques courantes (détournement de clic, injection de script) qu\'un site correctement configuré.',
      ceo_impact_en: 'The site is more vulnerable to common attacks (clickjacking, script injection) than a properly configured one.',
      financial_risk_fr: 'Risque accru de compromission exploitée pour du phishing ou du vol de données clients.',
      financial_risk_en: 'Increased risk of compromise exploited for phishing or customer data theft.',
      urgency_fr: missing.length >= 3 ? 'Sous 7 jours' : 'Sous 30 jours',
      urgency_en: missing.length >= 3 ? 'Within 7 days' : 'Within 30 days',
      tech_details_fr: `En-têtes absents : ${missing.map((h) => h.label_fr).join(', ')}.`,
      tech_details_en: `Missing headers: ${missing.map((h) => h.label_en).join(', ')}.`,
      remediation_code: missing.map((h) => `${h.label_fr}: à ajouter côté serveur/CDN`).join('\n'),
      remediation_lang: 'texte',
    });
  }

  if (facts.exposed_files.length > 0) {
    findings.push({
      id: next(),
      title_fr: `${facts.exposed_files.length} fichier(s) sensible(s) exposé(s) publiquement`,
      title_en: `${facts.exposed_files.length} sensitive file(s) publicly exposed`,
      severity: 'critique',
      category: 'Fuite de configuration',
      ceo_impact_fr: 'Des fichiers contenant potentiellement des identifiants ou du code source sont accessibles à n\'importe qui.',
      ceo_impact_en: 'Files potentially containing credentials or source code are accessible to anyone.',
      financial_risk_fr: 'Compromission complète possible du site ou de la base de données si des identifiants sont exposés.',
      financial_risk_en: 'Full site or database compromise possible if credentials are exposed.',
      urgency_fr: 'Immédiate',
      urgency_en: 'Immediate',
      tech_details_fr: `Chemins exposés : ${facts.exposed_files.join(', ')}.`,
      tech_details_en: `Exposed paths: ${facts.exposed_files.join(', ')}.`,
      remediation_code: 'Restreindre l\'accès public à ces fichiers via la configuration serveur (.htaccess, nginx.conf) ou les supprimer.',
      remediation_lang: 'texte',
    });
  }

  if (facts.open_ports.length > 0) {
    findings.push({
      id: next(),
      title_fr: `${facts.open_ports.length} port(s) réseau sensible(s) ouvert(s)`,
      title_en: `${facts.open_ports.length} sensitive network port(s) open`,
      severity: 'eleve',
      category: 'Exposition réseau',
      ceo_impact_fr: 'Des services internes (base de données, administration) sont potentiellement accessibles depuis Internet.',
      ceo_impact_en: 'Internal services (database, administration) are potentially accessible from the Internet.',
      financial_risk_fr: 'Un attaquant peut tenter de forcer l\'accès à ces services pour voler ou détruire des données.',
      financial_risk_en: 'An attacker can attempt to force access to these services to steal or destroy data.',
      urgency_fr: 'Sous 7 jours',
      urgency_en: 'Within 7 days',
      tech_details_fr: `Ports ouverts : ${facts.open_ports.map((p) => `${p.port} (${p.service})`).join(', ')}.`,
      tech_details_en: `Open ports: ${facts.open_ports.map((p) => `${p.port} (${p.service})`).join(', ')}.`,
      remediation_code: 'Fermer ces ports au niveau du pare-feu, ou les restreindre à des IP de confiance uniquement.',
      remediation_lang: 'texte',
    });
  }

  if (!facts.dns_mail_security.spf_found || !facts.dns_mail_security.dmarc_found) {
    findings.push({
      id: next(),
      title_fr: 'Protection anti-usurpation email incomplète (SPF/DMARC)',
      title_en: 'Incomplete anti-spoofing email protection (SPF/DMARC)',
      severity: 'moyen',
      category: 'Sécurité email',
      ceo_impact_fr: 'Des personnes malveillantes peuvent envoyer des emails de phishing qui semblent provenir de votre entreprise.',
      ceo_impact_en: 'Malicious actors can send phishing emails that appear to come from your company.',
      financial_risk_fr: 'Atteinte à la réputation de la marque, risque pour les clients ciblés par usurpation.',
      financial_risk_en: 'Damage to brand reputation, risk to customers targeted by impersonation.',
      urgency_fr: 'Sous 30 jours',
      urgency_en: 'Within 30 days',
      tech_details_fr: `SPF : ${facts.dns_mail_security.spf_found ? 'présent' : 'absent'}. DMARC : ${facts.dns_mail_security.dmarc_found ? 'présent' : 'absent'}.`,
      tech_details_en: `SPF: ${facts.dns_mail_security.spf_found ? 'present' : 'missing'}. DMARC: ${facts.dns_mail_security.dmarc_found ? 'present' : 'missing'}.`,
      remediation_code: 'Ajouter les enregistrements DNS TXT manquants (SPF et/ou DMARC) auprès de l\'hébergeur du domaine.',
      remediation_lang: 'texte',
    });
  }

  const cookieIssues = facts.cookie_security.cookies_missing_secure.length + facts.cookie_security.cookies_missing_httponly.length;
  if (cookieIssues > 0) {
    findings.push({
      id: next(),
      title_fr: 'Cookies sans protection suffisante',
      title_en: 'Cookies without sufficient protection',
      severity: 'moyen',
      category: 'Sécurité session',
      ceo_impact_fr: 'Les sessions des utilisateurs sont plus facilement volables, ce qui peut mener à des usurpations de compte.',
      ceo_impact_en: 'User sessions are more easily stolen, which can lead to account takeover.',
      financial_risk_fr: 'Risque de fraude sur les comptes clients ou administrateurs.',
      financial_risk_en: 'Risk of fraud on customer or administrator accounts.',
      urgency_fr: 'Sous 30 jours',
      urgency_en: 'Within 30 days',
      tech_details_fr: `Cookies sans flag Secure : ${facts.cookie_security.cookies_missing_secure.join(', ') || 'aucun'}. Sans HttpOnly : ${facts.cookie_security.cookies_missing_httponly.join(', ') || 'aucun'}.`,
      tech_details_en: `Cookies without Secure flag: ${facts.cookie_security.cookies_missing_secure.join(', ') || 'none'}. Without HttpOnly: ${facts.cookie_security.cookies_missing_httponly.join(', ') || 'none'}.`,
      remediation_code: 'Ajouter les flags Secure et HttpOnly à tous les cookies de session.',
      remediation_lang: 'texte',
    });
  }

  return findings;
}
