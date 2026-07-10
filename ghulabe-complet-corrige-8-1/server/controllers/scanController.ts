import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { generateAuditLog } from '../utils/crypto';
import { runFullScan } from '../services/scanEngine';
import { generateFindingsFromScan, VulnerabilityFinding } from '../services/geminiAnalysis';

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

    // 3. Persistance réelle — schéma confirmé : scans.domain_id référence domains.id (pas de user_id/url/status sur scans directement)
    let scanId: string | null = null;
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

        if (existingDomain) {
          domainId = existingDomain.id;
          await supabaseAdmin
            .from('domains')
            .update({ score, status: domainStatus, last_scan: new Date().toISOString() })
            .eq('id', domainId);
        } else {
          const { data: newDomain, error: domainInsertError } = await supabaseAdmin
            .from('domains')
            .insert({ user_id: userId, url: cleanUrl, score, status: domainStatus, last_scan: new Date().toISOString() })
            .select('id')
            .single();
          if (domainInsertError || !newDomain) throw domainInsertError || new Error('Création domaine échouée sans erreur explicite.');
          domainId = newDomain.id;
        }

        // 3b. Insère le scan lié à ce domaine
        reportPdfUrl = `https://ghulabe.com/reports/${domainId}-${Date.now()}.pdf`;
        const { data: newScan, error: scanInsertError } = await supabaseAdmin
          .from('scans')
          .insert({ domain_id: domainId, score, findings, report_pdf_url: reportPdfUrl })
          .select('id')
          .single();

        if (scanInsertError || !newScan) throw scanInsertError || new Error('Insertion scan échouée sans erreur explicite.');
        scanId = newScan.id;
        persisted = true;

        // 3c. Publication automatique d'une mission freelance si le score est critique (< 4/10).
        // Cœur du modèle économique GHULABE : un score critique déclenche immédiatement une
        // alerte + une mission de correction proposée aux développeurs partenaires, sans
        // intervention manuelle. Isolé dans son propre try/catch : un échec ici ne doit jamais
        // faire échouer la réponse du scan (l'utilisateur doit recevoir son résultat quoi qu'il arrive).
        if (domainStatus === 'critical') {
          try {
            const { data: userRow } = await supabaseAdmin
              .from('users')
              .select('name')
              .eq('id', userId)
              .maybeSingle();
            const clientName = userRow?.name || 'Client GHULABE';

            const criticalCount = findings.filter((f) => f.severity === 'critique').length;
            const alertMessageFr = `⚠️ Score critique (${score}/10) détecté sur ${cleanUrl}. ${criticalCount} faille(s) critique(s) identifiée(s). Une mission de correction a été publiée automatiquement.`;
            const alertMessageEn = `⚠️ Critical score (${score}/10) detected on ${cleanUrl}. ${criticalCount} critical vulnerability(ies) found. A remediation mission has been published automatically.`;

            // 3c-i. Alerte liée au domaine et à l'utilisateur (alerts.user_id existe : pas besoin de jointure via domains).
            const { data: newAlert, error: alertInsertError } = await supabaseAdmin
              .from('alerts')
              .insert({
                domain_id: domainId,
                user_id: userId,
                severity: 'critique',
                message: alertMessageFr,
                message_fr: alertMessageFr,
                message_en: alertMessageEn,
                is_read: false,
              })
              .select('id')
              .single();

            if (alertInsertError || !newAlert) throw alertInsertError || new Error('Insertion alerte échouée sans erreur explicite.');

            // 3c-ii. Mission liée à l'alerte, pas encore assignée : assigned_dev_id (→ users) et
            // developer_id (→ dev_applications) restent null jusqu'à ce qu'un développeur postule/soit assigné.
            const missionDescriptionFr = `Correction urgente requise suite à un scan GHULABE : score ${score}/10 sur ${cleanUrl}. ${criticalCount} faille(s) critique(s) détectée(s) nécessitant une intervention immédiate.`;

            const { error: missionInsertError } = await supabaseAdmin
              .from('missions')
              .insert({
                alert_id: newAlert.id,
                client_id: userId,
                client_name: clientName,
                developer_id: null,
                developer_name: null,
                assigned_dev_id: null,
                description: missionDescriptionFr,
                url: cleanUrl,
                urgency: 'Critique',
                budget_fcfa: 50000,
                status: 'requested',
                legal_checkbox_accepted: true,
              });

            if (missionInsertError) throw missionInsertError;

            generateAuditLog({
              action: 'MISSION_AUTO_PUBLISHED',
              userId,
              ipAddress: ip,
              targetUrl: cleanUrl,
              status: 'SUCCESS',
              details: `Mission publiée automatiquement suite à un score critique (${score}/10). Alerte ${newAlert.id}.`,
            });
          } catch (missionErr: any) {
            console.warn('[GHULABE Scan] Publication automatique de mission échouée:', missionErr.message);
            generateAuditLog({
              action: 'MISSION_AUTO_PUBLISH_FAILED',
              userId,
              ipAddress: ip,
              targetUrl: cleanUrl,
              status: 'FAILED',
              details: `Échec de la publication automatique de mission: ${missionErr.message}`,
            });
          }
        }
      } catch (dbErr: any) {
        // On ne fait jamais échouer la réponse du scan pour une erreur de persistance :
        // l'utilisateur a payé pour un scan, il doit recevoir son résultat même si la sauvegarde échoue.
        console.warn('[GHULABE Scan] Persistance DB échouée (résultat quand même renvoyé):', dbErr.message);
        generateAuditLog({
          action: 'SCAN_PERSIST_FAILED',
          userId,
          ipAddress: ip,
          targetUrl: cleanUrl,
          status: 'FAILED',
          details: `Scan calculé mais non sauvegardé: ${dbErr.message}`,
        });
      }
    }
    // Scan anonyme (pas de userId) : jamais persisté (domains.user_id attend un uuid réel), résultat renvoyé quand même.

    generateAuditLog({
      action: 'SCAN_COMPLETED',
      userId: userId || 'ANONYMOUS',
      ipAddress: ip,
      targetUrl: cleanUrl,
      status: 'SUCCESS',
      details: `Scan terminé en ${durationSeconds}s. Score: ${score}/10. ${findings.length} faille(s) détectée(s). Persisté: ${persisted}.`,
    });

    res.status(200).json({
      message_fr: "Scan externe terminé.",
      message_en: "External scan completed.",
      scanId,
      persisted,
      url: cleanUrl,
      score,
      duration_seconds: durationSeconds,
      report_pdf_url: reportPdfUrl,
      findings,
      headers_checked: {
        hsts: facts.headers_checked.hsts,
        csp: facts.headers_checked.csp,
        x_frame_options: facts.headers_checked.x_frame_options,
        x_content_type_options: facts.headers_checked.x_content_type_options,
      },
      ssl_status: {
        valid: facts.ssl_status.valid,
        expires_in_days: facts.ssl_status.expires_in_days,
        issuer: facts.ssl_status.issuer,
      },
      exposed_files: facts.exposed_files,
    });
  } catch (err: any) {
    generateAuditLog({
      action: 'SCAN_FAILED',
      userId: userId || 'ANONYMOUS',
      ipAddress: ip,
      targetUrl: cleanUrl,
      status: 'FAILED',
      details: `Erreur critique lors du scan : ${err.message}`,
    });
    res.status(500).json({ error_fr: "Erreur critique lors du scan.", details: err.message });
  }
}

export async function getScanReport(req: Request, res: Response): Promise<void> {
  const { scanId } = req.params;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const userId = req.user?.id;

  if (!scanId) {
    res.status(400).json({ error_fr: "ID de scan manquant.", error_en: "Missing scan ID." });
    return;
  }

  // requireAuth garantit normalement req.user, mais on vérifie quand même par défense en profondeur.
  if (!userId) {
    res.status(401).json({
      error_fr: "🔒 Accès non autorisé : authentification requise pour consulter un rapport.",
      error_en: "🔒 Unauthorized: authentication required to view a report.",
      code: 'UNAUTHORIZED_NO_TOKEN',
    });
    return;
  }

  try {
    // scans.domain_id référence domains.id : on vérifie la propriété via une jointure sur domains.user_id (anti-IDOR).
    // domains!inner(...) impose que le domaine lié appartienne bien à userId, sinon aucune ligne n'est retournée.
    const { data: scan, error } = await supabaseAdmin
      .from('scans')
      .select('id, domain_id, score, findings, report_pdf_url, created_at, domains!inner(url, user_id)')
      .eq('id', scanId)
      .eq('domains.user_id', userId)
      .maybeSingle();

    if (error) {
      generateAuditLog({
        action: 'SCAN_REPORT_DB_ERROR',
        userId,
        ipAddress: ip,
        targetUrl: scanId,
        status: 'FAILED',
        details: `Erreur Supabase lors de la lecture du rapport: ${error.message}`,
      });
      res.status(500).json({ error_fr: "Erreur lors de la lecture du rapport.", error_en: "Error reading the report.", details: error.message });
      return;
    }

    if (!scan) {
      generateAuditLog({
        action: 'SCAN_REPORT_NOT_FOUND_OR_DENIED',
        userId,
        ipAddress: ip,
        targetUrl: scanId,
        status: 'BLOCKED',
        details: 'Scan introuvable ou n\'appartenant pas à cet utilisateur.',
      });
      res.status(404).json({
        error_fr: "Rapport introuvable.",
        error_en: "Report not found.",
        code: 'SCAN_NOT_FOUND',
      });
      return;
    }

    const domainInfo = Array.isArray(scan.domains) ? scan.domains[0] : scan.domains;
    const findingsArr = Array.isArray(scan.findings) ? scan.findings : [];

    generateAuditLog({
      action: 'SCAN_REPORT_ACCESSED',
      userId,
      ipAddress: ip,
      targetUrl: domainInfo?.url,
      status: 'SUCCESS',
      details: `Consultation du rapport scan ${scanId}.`,
    });

    res.status(200).json({
      id: scan.id,
      url: domainInfo?.url,
      score: scan.score,
      report_pdf_url: scan.report_pdf_url,
      findings: scan.findings,
      created_at: scan.created_at,
      ceoSection: {
        scoreLabel: `Score Global de Sécurité : ${scan.score} / 10`,
        executiveSummary: scan.score < 5
          ? `Niveau de danger élevé. ${findingsArr.length} faille(s) active(s) nécessitant une intervention rapide.`
          : `Niveau de sécurité acceptable. ${findingsArr.length} point(s) d'attention identifié(s).`,
      },
      devSection: {
        instructions: "Consultez la liste 'findings' pour le détail technique de chaque faille et sa correction recommandée.",
      },
    });
  } catch (err: any) {
    generateAuditLog({
      action: 'SCAN_REPORT_FAILED',
      userId,
      ipAddress: ip,
      targetUrl: scanId,
      status: 'FAILED',
      details: `Erreur critique lors de la lecture du rapport: ${err.message}`,
    });
    res.status(500).json({ error_fr: "Erreur critique lors de la lecture du rapport.", details: err.message });
  }
}

export async function getScanHistory(req: Request, res: Response): Promise<void> {
  const { domainId } = req.params;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const userId = req.user?.id;

  if (!domainId) {
    res.status(400).json({ error_fr: "ID de domaine manquant.", error_en: "Missing domain ID." });
    return;
  }

  if (!userId) {
    res.status(401).json({
      error_fr: "🔒 Accès non autorisé : authentification requise pour consulter un historique.",
      error_en: "🔒 Unauthorized: authentication required to view history.",
      code: 'UNAUTHORIZED_NO_TOKEN',
    });
    return;
  }

  try {
    // 1. Vérifie que le domaine existe et appartient bien à l'utilisateur (anti-IDOR)
    const { data: domain, error: domainError } = await supabaseAdmin
      .from('domains')
      .select('id, url, user_id')
      .eq('id', domainId)
      .eq('user_id', userId)
      .maybeSingle();

    if (domainError) {
      generateAuditLog({
        action: 'SCAN_HISTORY_DB_ERROR',
        userId,
        ipAddress: ip,
        targetUrl: domainId,
        status: 'FAILED',
        details: `Erreur Supabase lors de la lecture du domaine: ${domainError.message}`,
      });
      res.status(500).json({ error_fr: "Erreur lors de la lecture du domaine.", details: domainError.message });
      return;
    }

    if (!domain) {
      generateAuditLog({
        action: 'SCAN_HISTORY_DOMAIN_NOT_FOUND_OR_DENIED',
        userId,
        ipAddress: ip,
        targetUrl: domainId,
        status: 'BLOCKED',
        details: 'Domaine introuvable ou n\'appartenant pas à cet utilisateur.',
      });
      res.status(404).json({
        error_fr: "Domaine introuvable.",
        error_en: "Domain not found.",
        code: 'DOMAIN_NOT_FOUND',
      });
      return;
    }

    // 2. scans.domain_id référence directement domains.id — schéma réel confirmé, plus besoin de relier par url.
    const { data: scans, error: scansError } = await supabaseAdmin
      .from('scans')
      .select('id, score, created_at')
      .eq('domain_id', domainId)
      .order('created_at', { ascending: false });

    if (scansError) {
      generateAuditLog({
        action: 'SCAN_HISTORY_DB_ERROR',
        userId,
        ipAddress: ip,
        targetUrl: domain.url,
        status: 'FAILED',
        details: `Erreur Supabase lors de la lecture de l'historique: ${scansError.message}`,
      });
      res.status(500).json({ error_fr: "Erreur lors de la lecture de l'historique.", details: scansError.message });
      return;
    }

    const history = scans || [];

    generateAuditLog({
      action: 'SCAN_HISTORY_ACCESSED',
      userId,
      ipAddress: ip,
      targetUrl: domain.url,
      status: 'SUCCESS',
      details: `Consultation de l'historique (${history.length} scan(s)) pour le domaine ${domainId}.`,
    });

    res.status(200).json({
      domainId,
      url: domain.url,
      totalScans: history.length,
      latestScore: history.length > 0 ? history[0].score : null,
      history: history.map((s) => ({ id: s.id, score: s.score, date: s.created_at })),
    });
  } catch (err: any) {
    generateAuditLog({
      action: 'SCAN_HISTORY_FAILED',
      userId,
      ipAddress: ip,
      targetUrl: domainId,
      status: 'FAILED',
      details: `Erreur critique lors de la lecture de l'historique: ${err.message}`,
    });
    res.status(500).json({ error_fr: "Erreur critique lors de la lecture de l'historique.", details: err.message });
  }
}
