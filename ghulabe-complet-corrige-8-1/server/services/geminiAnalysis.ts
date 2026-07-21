import { generateAuditLog } from '../utils/crypto';
import type { RawScanFacts } from './scanEngine';

// ============================================================================
// GHULABE — ANALYSE IA DES RÉSULTATS DE SCAN (GEMINI)
// Prend les faits bruts collectés par scanEngine.ts (headers, SSL, fichiers
// exposés) et les transforme en verdicts bilingues FR/EN exploitables par
// l'interface (impact CEO, risque financier, urgence, code de remédiation).
// Gemini n'effectue AUCUNE requête réseau vers la cible : il ne fait
// qu'interpréter des données déjà collectées par le vrai moteur de scan.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

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
- Réponds UNIQUEMENT avec le JSON demandé, sans texte autour.`;

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
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    generateAuditLog({
      action: 'GEMINI_ANALYSIS_SKIPPED',
      userId,
      ipAddress: ip,
      targetUrl: facts.hostname,
      status: 'BLOCKED',
      details: 'GEMINI_API_KEY absente de la configuration serveur (.env). Analyse IA ignorée.',
    });
    return [];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const res = await fetch(`${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: 'user', parts: [{ text: buildUserPrompt(facts) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.3,
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini API a répondu ${res.status} : ${errBody.slice(0, 300)}`);
    }

    const data: any = await res.json();
    const rawText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Réponse Gemini vide ou mal formée.');
    }

    const parsed = extractJsonArray(rawText);
    if (!Array.isArray(parsed)) {
      throw new Error('La réponse Gemini ne contient pas un tableau JSON.');
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
