import { computeRequiredSpecialties } from '../utils/specialtyMapping';
import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { generateAuditLog } from '../utils/crypto';
import { runFullScan } from '../services/scanEngine';
import { generateFindingsFromScan, VulnerabilityFinding } from '../services/geminiAnalysis';
import { generateScanReportPdf } from '../services/pdfReportService';
/**
 * Calcule un score de sécurité sur 10 à partir des faits réels du scan
 * (headers manquants, SSL invalide/expirant, fichiers exposés, gravité des
 * verdicts générés). Remplace le score fixe 3.2 précédemment codé en dur.
 */
function computeSecurityScore(
  headers: { hsts: boolean; csp: boolean; x_frame_options: boolean; x_content_type_options: boolean },
  ssl: { valid: boolean; expires_in_days: number },
  exposedFilesCount: number,
  findings: VulnerabilityFinding[]
): number {
  let score = 10;

  if (!headers.hsts) score -= 1.5;
  if (!headers.csp) score -= 1.5;
  if (!headers.x_frame_options) score -= 1;
  if (!headers.x_content_type_options) score -= 1;

  if (!ssl.valid) score -= 3;
  else if (ssl.expires_in_days < 14) score -= 1;

  score -= Math.min(exposedFilesCount, 3) * 1;

  for (const finding of findings) {
    if (finding.severity === 'critique') score -= 2;
    else if (finding.severity === 'eleve') score -= 1;
    else if (finding.severity === 'moyen') score -= 0.5;
    else score -= 0.2;
  }

  return Math.max(0, Math.round(score * 10) / 10);
}

export async function startScan(req: Request, res: Response): Promise<void> {
  const { url, legalCheckboxAccepted } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const userId = req.user?.id; // uuid réel si authentifié, undefined sinon (scan anonyme)

  // MANDATORY CHECK : ACCORD OBLIGATOIRE CASE À COCHER
  if (!legalCheckboxAccepted) {
    generateAuditLog({
      action: 'SCAN_REJECTED_NO_LEGAL_CONSENT',
      userId: userId || 'ANONYMOUS',
      ipAddress: ip,
      targetUrl: url,
      status: 'BLOCKED',
      details: 'Tentative de scan sans avoir coché la case d\'autorisation externe obligatoire.',
    });

    res.status(403).json({
      error_fr: "⚠️ Accord obligatoire requis : Vous devez certifier être le propriétaire ou l'administrateur autorisé de ce domaine.",
      error_en: "⚠️ Mandatory agreement required: You must certify ownership of this domain before scanning.",
      code: 'MISSING_LEGAL_CONSENT',
    });
    return;
  }

  if (!url || typeof url !== 'string' || !url.includes('.')) {
    res.status(400).json({
      error_fr: "L'URL fournie est invalide. Veuillez renseigner un nom de domaine valide.",
      error_en: "Invalid URL provided.",
    });
    return;
  }

  const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

  generateAuditLog({
    action: 'SCAN_STARTED',
    userId: userId || 'ANONYMOUS',
    ipAddress: ip,
    targetUrl: cleanUrl,
    status: 'SUCCESS',
    details: 'Démarrage de l\'analyse externe asynchrone.',
  });

  try {
    // 1. Moteur de scan RÉEL : headers HTTP, certificat SSL/TLS, fichiers exposés
    const facts = await runFullScan(cleanUrl, userId || 'ANONYMOUS', ip);

    // 2. Analyse IA Gemini à partir des faits réels (jamais de faille inventée hors faits constatés)
    const findings = await generateFindingsFromScan(facts, userId || 'ANONYMOUS', ip);

    const score = computeSecurityScore(facts.headers_checked, facts.ssl_status, facts.exposed_files.length, findings);
    const durationSeconds = Math.round(facts.duration_ms / 1000);
    const domainStatus = score >= 7 ? 'safe' : score >= 4 ? 'warning' : 'critical';
let scanId: string | null = null;
    // 3. Persistance réelle — schéma confirmé : scans.domain_id référence domains.id (pas de user_id/url/status sur scans directement)
    let reportPdfUrl: string | null = null;
  let persisted = false;
    
    if (userId) {
      try {
        // 3a. Cherche le domaine existant pour cet utilisateur, sinon le crée
        let domainId: string;
        const { data: existingDomain, error: findError } = await supabaseAdmin
          .from('domains')
          .select('id')
          .eq('user_id', userId)
          .eq('url', cleanUrl)
          .maybeSingle();

        if (findError) throw findError;

        // Certification GHULABE : score >= 8/10 ET zéro faille critique.
        // Recalculée à CHAQUE scan (jamais figée) : une régression fait perdre le badge.
        const criticalCount = findings.filter((f) => f.severity === 'critique').length;
        const isCertified = score >= 8 && criticalCount === 0;
        const certificationFields = isCertified
          ? { certified: true, certified_at: new Date().toISOString(), certification_score: score }
          : { certified: false, certified_at: null, certification_score: score };

        if (existingDomain) {
          domainId = existingDomain.id;
          await supabaseAdmin
            .from('domains')
            .update({ score, status: domainStatus, last_scan: new Date().toISOString(), ...certificationFields })
            .eq('id', domainId);
        } else {
          const { data: newDomain, error: domainInsertError } = await supabaseAdmin
            .from('domains')
            .insert({ user_id: userId, url: cleanUrl, score, status: domainStatus, last_scan: new Date().toISOString(), ...certificationFields })
            .select('id')
            .single();
          if (domainInsertError || !newDomain) throw domainInsertError || new Error('Création domaine échouée sans erreur explicite.');
          domainId = newDomain.id;
        }

        // 3b. Insère le scan lié à ce domaine
        try {
  reportPdfUrl = await generateScanReportPdf(cleanUrl, score, facts, findings, `${domainId}-${Date.now()}`);
} catch (pdfErr: any) {
  console.warn('[GHULABE Scan] Génération PDF échouée:', pdfErr.message);
  generateAuditLog({
    action: 'PDF_GENERATION_FAILED',
    userId: userId || 'ANONYMOUS',
    ipAddress: ip,
    targetUrl: cleanUrl,
    status: 'FAILED',
    details: `Échec génération PDF: ${pdfErr.message}`,
  });
  reportPdfUrl = null;
        }
        const { data: newScan, error: scanInsertError } = await supabaseAdmin
          .from('scans')
          .insert({ domain_id: domainId, score, findings, report_pdf_url: reportPdfUrl })
          .select('id')
          .single();

        if (scanInsertError || !newScan) throw scanInsertError || new Error('Insertion scan échouée sans erreur explicite.');
        scanId = newScan.id;
        persisted = true;
