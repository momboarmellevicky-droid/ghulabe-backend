import { computeRequiredSpecialties } from '../utils/specialtyMapping';
import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { generateAuditLog } from '../utils/crypto';
import { runFullScan } from '../services/scanEngine';
import { generateFindingsFromScan, generateDeterministicFindings, VulnerabilityFinding } from '../services/geminiAnalysis';
import { generateScanReportPdf } from '../services/pdfReportService';
import { sendWhatsAppAlert } from '../services/whatsappService';
import { sendScanReportEmail } from '../services/emailService';
import { isValidEmail, isValidPhoneNumber } from '../utils/validators';
import { checkUrlReputation } from '../services/virusTotalService';
/**
 * Calcule un score de sécurité sur 10 à partir des faits réels du scan
 * (headers manquants, SSL invalide/expirant, fichiers exposés, gravité des
 * verdicts générés). Remplace le score fixe 3.2 précédemment codé en dur.
 */
export function computeSecurityScore(
  headers: { hsts: boolean; csp: boolean; x_frame_options: boolean; x_content_type_options: boolean },
  ssl: { valid: boolean; expires_in_days: number },
  exposedFilesCount: number,
  findings: VulnerabilityFinding[],
  openPortsCount: number = 0,
  dnsMail?: { spf_found: boolean; dmarc_found: boolean },
  cookieIssuesCount: number = 0
): number {
  let score = 10;

  if (!headers.hsts) score -= 1.5;
  if (!headers.csp) score -= 1.5;
  if (!headers.x_frame_options) score -= 1;
  if (!headers.x_content_type_options) score -= 1;

  if (!ssl.valid) score -= 3;
  else if (ssl.expires_in_days < 14) score -= 1;

  score -= Math.min(exposedFilesCount, 3) * 1;

  // Ports réseau sensibles ouverts (base de données, admin, SSH mal configuré)
  score -= Math.min(openPortsCount, 3) * 1;

  // Sécurité email du domaine (usurpation/phishing sous le nom de la PME)
  if (dnsMail) {
    if (!dnsMail.spf_found) score -= 0.5;
    if (!dnsMail.dmarc_found) score -= 0.5;
  }

  // Cookies mal protégés (vol de session)
  score -= Math.min(cookieIssuesCount, 3) * 0.3;

  for (const finding of findings) {
    if (finding.severity === 'critique') score -= 2;
    else if (finding.severity === 'eleve') score -= 1;
    else if (finding.severity === 'moyen') score -= 0.5;
    else score -= 0.2;
  }

  return Math.max(0, Math.round(score * 10) / 10);
}

export async function startScan(req: Request, res: Response): Promise<void> {
  const { url, legalCheckboxAccepted, contactEmail, contactPhone } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const userId = req.user?.id;

  // Détermine le plan réel de l'utilisateur connecté (source de vérité pour le
  // verrouillage commercial). Un compte connecté mais sur le plan gratuit n'a
  // pas plus de droits qu'un visiteur anonyme sur le détail des failles.
  let userPlan: string | null = null;
  if (userId) {
    const { data: userRow } = await supabaseAdmin.from('users').select('plan').eq('id', userId).maybeSingle();
    userPlan = userRow?.plan || null;
  }
  const isGardien = userPlan === 'gardien';

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
    // Fallback déterministe si l'IA échoue ou ne renvoie rien : évite un rapport
    // vide/contradictoire avec le score quand des problèmes réels existent.
    let findings = await generateFindingsFromScan(facts, userId || 'ANONYMOUS', ip);
    if (findings.length === 0) {
      findings = generateDeterministicFindings(facts);
    }

    // 2b. Vérification de réputation VirusTotal (détection phishing/malveillance connue)
    const reputation = await checkUrlReputation(cleanUrl, userId || 'ANONYMOUS', ip);
    if (reputation.checked && reputation.flagged) {
      findings.unshift({
        id: `vt-${Date.now()}`,
        title_fr: 'Domaine signalé comme malveillant par la communauté sécurité',
        title_en: 'Domain flagged as malicious by the security community',
        severity: 'critique',
        category: 'reputation',
        ceo_impact_fr: `Ce domaine est signalé par ${reputation.malicious} moteur(s) de sécurité comme malveillant ou par ${reputation.suspicious} comme suspect (base VirusTotal). Les visiteurs et navigateurs peuvent bloquer ou avertir avant l'accès à ce site.`,
        ceo_impact_en: `This domain is flagged by ${reputation.malicious} security engine(s) as malicious or ${reputation.suspicious} as suspicious (VirusTotal). Visitors and browsers may block or warn before accessing this site.`,
        financial_risk_fr: 'Perte de confiance client, blocage par les navigateurs, impact direct sur les ventes et la réputation de la marque.',
        financial_risk_en: 'Loss of customer trust, browser blocking, direct impact on sales and brand reputation.',
        urgency_fr: 'Action immédiate requise : vérifier une compromission du site et demander un ré-examen auprès de VirusTotal une fois le problème résolu.',
        urgency_en: 'Immediate action required: check for site compromise and request re-review from VirusTotal once resolved.',
        tech_details_fr: `Score VirusTotal : ${reputation.malicious} malveillant(s) / ${reputation.suspicious} suspect(s) / ${reputation.harmless} sain(s) sur l'ensemble des moteurs interrogés.`,
        tech_details_en: `VirusTotal score: ${reputation.malicious} malicious / ${reputation.suspicious} suspicious / ${reputation.harmless} harmless across all engines queried.`,
        remediation_code: '',
        remediation_lang: '',
      });
    }

    const score = computeSecurityScore(facts.headers_checked, facts.ssl_status, facts.exposed_files.length, findings, facts.open_ports.length, facts.dns_mail_security, facts.cookie_security.cookies_missing_secure.length + facts.cookie_security.cookies_missing_httponly.length);
    const durationSeconds = Math.round(facts.duration_ms / 1000);
    const domainStatus = score >= 7 ? 'safe' : score >= 6 ? 'warning' : 'critical';

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

        // Certification GHULABE : score >= 8/10 ET zéro faille critique.
        // Recalculée à CHAQUE scan (jamais figée) : une régression fait perdre le badge.
        const criticalCount = findings.filter((f) => f.severity === 'critique').length;
        const isCertified = score >= 8 && criticalCount === 0;
        const previouslyCertified = existingDomain ? (await supabaseAdmin
          .from('domains').select('certified').eq('id', existingDomain.id).single()
        ).data?.certified === true : false;
        const complianceStatus = isCertified ? 'conforme' : score >= 5 ? 'en_cours' : 'non_conforme';
        const certificationFields = isCertified
          ? { certified: true, certified_at: new Date().toISOString(), certification_score: score, compliance_status: complianceStatus, was_certified_before: true }
          : { certified: false, certified_at: null, certification_score: score, compliance_status: complianceStatus, was_certified_before: previouslyCertified };

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
          reportPdfUrl = await generateScanReportPdf(cleanUrl, score, facts, findings, `${domainId}-${Date.now()}`, !isGardien);
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
        // 3c. Publication automatique d'une mission freelance si le score est critique (< 4/10).
        // Cœur du modèle économique GHULABE : un score critique déclenche immédiatement une
        // alerte + une mission de correction proposée aux développeurs partenaires, sans
        // intervention manuelle. Isolé dans son propre try/catch : un échec ici ne doit jamais
        // faire échouer la réponse du scan (l'utilisateur doit recevoir son résultat quoi qu'il arrive).
        if (domainStatus === 'critical') {
          try {
            const { data: userRow } = await supabaseAdmin
              .from('users')
              .select('name, phone')
              .eq('id', userId)
              .maybeSingle();
            const clientName = userRow?.name || 'Client GHULABE';

            const criticalCount = findings.filter((f) => f.severity === 'critique').length;
        const criticalityDetailFr = criticalCount > 0 ? `${criticalCount} faille(s) critique(s) identifiée(s).` : `Score abaissé par des lacunes de configuration (en-têtes de sécurité, SSL) sans faille critique isolée.`;
    const criticalityDetailEn = criticalCount > 0 ? `${criticalCount} critical vulnerability(ies) found.` : `Score lowered by configuration gaps (security headers, SSL) with no isolated critical vulnerability.`;
    const alertMessageFr = `⚠️ Score critique (${score}/10) détecté sur ${cleanUrl}. ${criticalityDetailFr} Une mission de correction a été publiée automatiquement.`;
    const alertMessageEn = `⚠️ Critical score (${score}/10) detected on ${cleanUrl}. ${criticalityDetailEn} A remediation mission has been published automatically.`;
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

            const requiredSpecialites = computeRequiredSpecialties(findings);

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
                required_specialites: requiredSpecialites,
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

            // 3c-iii. Envoi de l'alerte WhatsApp au client si un numéro de téléphone est renseigné.
            if (userRow?.phone) {
              await sendWhatsAppAlert(userRow.phone, alertMessageFr, userId, ip);
            }
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
    // Envoi email + WhatsApp du résultat si la personne a renseigné ses coordonnées (formulaire avant scan).
    if (!userId && (contactEmail || contactPhone)) {
      try {
        if (!reportPdfUrl) {
          try {
            reportPdfUrl = await generateScanReportPdf(cleanUrl, score, facts, findings, `anon-${Date.now()}`, true);
          } catch (pdfErr: any) {
            console.warn('[GHULABE Scan] Génération PDF (anonyme) échouée:', pdfErr.message);
          }
        }

        const summaryFr = `Votre scan de ${cleanUrl} est terminé. Score : ${score}/10. ${findings.length} faille(s) détectée(s).`;

        if (contactEmail && isValidEmail(contactEmail)) {
          await sendScanReportEmail(contactEmail, cleanUrl, score, findings.length, reportPdfUrl, 'fr', 'ANONYMOUS', ip);
        }
        if (contactPhone && isValidPhoneNumber(contactPhone)) {
          await sendWhatsAppAlert(contactPhone, summaryFr, 'ANONYMOUS', ip, reportPdfUrl || undefined);
        }
      } catch (notifyErr: any) {
        console.warn('[GHULABE Scan] Notification scan anonyme échouée:', notifyErr.message);
        generateAuditLog({
          action: 'SCAN_ANONYMOUS_NOTIFY_FAILED',
          userId: 'ANONYMOUS',
          ipAddress: ip,
          targetUrl: cleanUrl,
          status: 'FAILED',
          details: `Échec notification scan anonyme: ${notifyErr.message}`,
        });
      }
    }

    // Envoi automatique email + WhatsApp du résultat de scan (plan Gardien uniquement)
    if (userId) {
      try {
        const { data: gardienUser } = await supabaseAdmin
          .from('users')
          .select('plan, email, phone')
          .eq('id', userId)
          .maybeSingle();

        if (gardienUser?.plan === 'gardien') {
          const summaryFr = `Votre scan de ${cleanUrl} est terminé. Score : ${score}/10. ${findings.length} faille(s) détectée(s).`;

          if (gardienUser.email) {
            await sendScanReportEmail(gardienUser.email, cleanUrl, score, findings.length, reportPdfUrl, 'fr', userId, ip);
          }
          if (gardienUser.phone) {
            await sendWhatsAppAlert(gardienUser.phone, summaryFr, userId, ip, reportPdfUrl || undefined);
          }
        }
      } catch (notifyErr: any) {
        console.warn('[GHULABE Scan] Notification Gardien échouée:', notifyErr.message);
        generateAuditLog({
          action: 'SCAN_GARDIEN_NOTIFY_FAILED',
          userId,
          ipAddress: ip,
          targetUrl: cleanUrl,
          status: 'FAILED',
          details: `Échec notification plan Gardien: ${notifyErr.message}`,
        });
      }
    }

    generateAuditLog({
      action: 'SCAN_COMPLETED',
      userId: userId || 'ANONYMOUS',
      ipAddress: ip,
      targetUrl: cleanUrl,
      status: 'SUCCESS',
      details: `Scan terminé en ${durationSeconds}s. Score: ${score}/10. ${findings.length} faille(s) détectée(s). Persisté: ${persisted}.`,
    });

    // Verrouillage commercial : seul un compte réellement sur le plan Gardien reçoit
    // le détail exploitable des failles (impact business, risque financier, correctif).
    // Un compte connecté mais gratuit est traité exactement comme un visiteur anonyme —
    // c'est le plan payé qui débloque, pas la simple connexion.
    const isLocked = !isGardien;
    const criticalCountResp = findings.filter((f) => f.severity === 'critique').length;
    const highCountResp = findings.filter((f) => f.severity === 'eleve').length;
    const lockedFindings = findings.map((f) => ({
      id: f.id,
      severity: f.severity,
      category: f.category,
      title_fr: f.title_fr,
      title_en: f.title_en,
    }));

    res.status(200).json({
      message_fr: "Scan externe terminé.",
      message_en: "External scan completed.",
      scanId,
      persisted,
      url: cleanUrl,
      score,
      duration_seconds: durationSeconds,
      report_pdf_url: reportPdfUrl,
      locked: isLocked,
      upsell_fr: isLocked
        ? `🔒 ${findings.length} faille(s) détectée(s) dont ${criticalCountResp} critique(s). Débloquez le détail complet (impact business, risque financier, correctif exact) avec le plan GARDIEN — 5000 FCFA.`
        : undefined,
      upsell_en: isLocked
        ? `🔒 ${findings.length} issue(s) found including ${criticalCountResp} critical. Unlock full details (business impact, financial risk, exact fix) with the GARDIEN plan — 5000 FCFA.`
        : undefined,
      findings: isLocked ? lockedFindings : findings,
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
      details: `Erreur critique lors du scan: ${err.message}`,
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

    // Même verrouillage commercial qu'au moment du scan : seul le plan Gardien
    // donne accès au détail exploitable, même en relisant un rapport déjà généré.
    const { data: userRow } = await supabaseAdmin.from('users').select('plan').eq('id', userId).maybeSingle();
    const isGardien = userRow?.plan === 'gardien';
    const responseFindings = isGardien
      ? findingsArr
      : findingsArr.map((f: any) => ({ id: f.id, severity: f.severity, category: f.category, title_fr: f.title_fr, title_en: f.title_en }));

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
      report_pdf_url: isGardien ? scan.report_pdf_url : null,
      locked: !isGardien,
      findings: responseFindings,
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

export async function previewScan(req: Request, res: Response): Promise<void> {
  const { url, legalCheckboxAccepted } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!legalCheckboxAccepted) {
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
    action: 'PREVIEW_SCAN_STARTED',
    userId: 'ANONYMOUS',
    ipAddress: ip,
    targetUrl: cleanUrl,
    status: 'SUCCESS',
    details: 'Démarrage du scan aperçu (gratuit, résumé uniquement).',
  });
  try {
    const facts = await runFullScan(cleanUrl, 'ANONYMOUS', ip);
    let findings = await generateFindingsFromScan(facts, 'ANONYMOUS', ip);
    if (findings.length === 0) {
      findings = generateDeterministicFindings(facts);
    }

    const score = computeSecurityScore(
      facts.headers_checked,
      facts.ssl_status,
      facts.exposed_files.length,
      findings,
      facts.open_ports.length,
      facts.dns_mail_security,
      facts.cookie_security.cookies_missing_secure.length + facts.cookie_security.cookies_missing_httponly.length
    );

    const criticalCount = findings.filter((f) => f.severity === 'critique').length;
    const highCount = findings.filter((f) => f.severity === 'eleve').length;

    generateAuditLog({
      action: 'PREVIEW_SCAN_COMPLETED',
      userId: 'ANONYMOUS',
      ipAddress: ip,
      targetUrl: cleanUrl,
      status: 'SUCCESS',
      details: `Aperçu terminé. Score: ${score}/10. ${findings.length} faille(s) détectée(s) (non détaillées).`,
    });

    res.status(200).json({
      message_fr: "Aperçu du scan terminé. Débloquez le rapport complet pour voir le détail et les corrections.",
      message_en: "Scan preview complete. Unlock the full report to see details and fixes.",
      url: cleanUrl,
      score,
      summary: {
        total_findings: findings.length,
        critical: criticalCount,
        high: highCount,
      },
      locked: true,
      upsell_fr: `${findings.length} faille(s) détectée(s) dont ${criticalCount} critique(s). Débloquez le rapport complet pour le détail technique et les correctifs.`,
      upsell_en: `${findings.length} issue(s) found including ${criticalCount} critical. Unlock the full report for technical details and fixes.`,
    });
  } catch (err: any) {
    generateAuditLog({
      action: 'PREVIEW_SCAN_FAILED',
      userId: 'ANONYMOUS',
      ipAddress: ip,
      targetUrl: cleanUrl,
      status: 'FAILED',
      details: `Erreur lors de l'aperçu: ${err.message}`,
    });
    res.status(500).json({ error_fr: "Erreur lors de l'aperçu du scan.", details: err.message });
  }
}
