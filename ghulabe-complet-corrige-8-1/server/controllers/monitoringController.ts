import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { generateAuditLog } from '../utils/crypto';
import { runFullScan } from '../services/scanEngine';
import { generateFindingsFromScan } from '../services/geminiAnalysis';
import { computeSecurityScore } from './scanController';
import { detectNewFindings } from '../utils/findingsDiff';
import { sendVulnerabilityAlertEmail } from '../services/emailService';
import { sendWhatsAppAlert } from '../services/whatsappService';

/**
 * POST /api/cron/weekly-scan
 * Point d'entrée protégé par secret partagé (header x-cron-secret), appelé une
 * fois par semaine par un déclencheur externe (cron-job.org gratuit, ou Render
 * Cron Job). Ne dépend jamais d'un setInterval interne au process Node : sur
 * l'offre gratuite Render, l'instance s'éteint après inactivité et un
 * setInterval ne se déclencherait tout simplement jamais de façon fiable.
 *
 * Pour chaque domaine appartenant à un utilisateur au plan 'gardien' :
 * 1. Relance un scan réel complet.
 * 2. Compare aux résultats du scan précédent pour détecter les NOUVELLES failles.
 * 3. Si nouvelles failles (ou chute de score), crée une alerte en base +
 *    envoie un email réel (et un WhatsApp si Twilio est configuré).
 */
export async function runWeeklyMonitoring(req: Request, res: Response): Promise<void> {
  const providedSecret = req.headers['x-cron-secret'];
  if (!process.env.CRON_SECRET || providedSecret !== process.env.CRON_SECRET) {
    res.status(401).json({ error_fr: 'Non autorisé.', error_en: 'Unauthorized.' });
    return;
  }

  const summary = { domainsScanned: 0, alertsSent: 0, errors: 0 };

  try {
    // 1. Récupère tous les domaines des utilisateurs abonnés au plan Gardien.
    const { data: gardienDomains, error: fetchError } = await supabaseAdmin
      .from('domains')
      .select('id, url, user_id, users!inner(id, email, phone, name, plan)')
      .eq('users.plan', 'gardien');

    if (fetchError) throw fetchError;

    for (const domain of gardienDomains || []) {
      const owner: any = Array.isArray((domain as any).users) ? (domain as any).users[0] : (domain as any).users;
      try {
        // 2. Récupère le scan précédent (le plus récent avant celui qu'on va créer) pour le diff.
        const { data: previousScan } = await supabaseAdmin
          .from('scans')
          .select('findings')
          .eq('domain_id', domain.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 3. Relance un scan réel complet, identique au moteur utilisé pour un scan manuel.
        const facts = await runFullScan(domain.url, owner.id, 'CRON_WEEKLY');
        const findings = await generateFindingsFromScan(facts, owner.id, 'CRON_WEEKLY');
        const score = computeSecurityScore(facts.headers_checked, facts.ssl_status, facts.exposed_files.length, findings);
        const domainStatus = score >= 7 ? 'safe' : score >= 4 ? 'warning' : 'critical';
        const criticalCount = findings.filter((f) => f.severity === 'critique').length;
        const isCertified = score >= 8 && criticalCount === 0;

        await supabaseAdmin
          .from('domains')
          .update({
            score,
            status: domainStatus,
            last_scan: new Date().toISOString(),
            certified: isCertified,
            certified_at: isCertified ? new Date().toISOString() : null,
            certification_score: score,
          })
          .eq('id', domain.id);

        await supabaseAdmin.from('scans').insert({ domain_id: domain.id, score, findings });
        summary.domainsScanned += 1;

        // 4. Détecte les nouvelles failles par rapport au scan précédent.
        const previousFindings = previousScan?.findings || [];
        const newFindings = detectNewFindings(previousFindings, findings);

        if (newFindings.length > 0) {
          const newCriticalCount = newFindings.filter((f) => f.severity === 'critique').length;
          const messageFr = `🔍 Surveillance hebdomadaire GHULABE : ${newFindings.length} nouvelle(s) faille(s) détectée(s) sur ${domain.url} (${newCriticalCount} critique(s)). Score actuel : ${score}/10.`;
          const messageEn = `🔍 GHULABE weekly monitoring: ${newFindings.length} new vulnerability(ies) found on ${domain.url} (${newCriticalCount} critical). Current score: ${score}/10.`;

          await supabaseAdmin.from('alerts').insert({
            domain_id: domain.id,
            user_id: owner.id,
            severity: newCriticalCount > 0 ? 'critique' : 'moyen',
            message: messageFr,
            message_fr: messageFr,
            message_en: messageEn,
            is_read: false,
          });

          const emailSent = await sendVulnerabilityAlertEmail(
            owner.email,
            domain.url,
            newFindings.length,
            newCriticalCount,
            score,
            'fr',
            owner.id,
            'CRON_WEEKLY'
          );
          if (emailSent) summary.alertsSent += 1;

          if (owner.phone) {
            await sendWhatsAppAlert(owner.phone, messageFr, owner.id, 'CRON_WEEKLY');
          }
        }
      } catch (domainErr: any) {
        summary.errors += 1;
        generateAuditLog({
          action: 'WEEKLY_MONITORING_DOMAIN_FAILED',
          userId: owner?.id,
          ipAddress: 'CRON_WEEKLY',
          targetUrl: domain.url,
          status: 'FAILED',
          details: `Échec surveillance hebdomadaire pour ${domain.url}: ${domainErr.message}`,
        });
      }
    }

    generateAuditLog({
      action: 'WEEKLY_MONITORING_COMPLETED',
      ipAddress: 'CRON_WEEKLY',
      status: 'SUCCESS',
      details: `Surveillance hebdomadaire terminée : ${summary.domainsScanned} domaine(s) scanné(s), ${summary.alertsSent} alerte(s) envoyée(s), ${summary.errors} erreur(s).`,
    });

    res.status(200).json(summary);
  } catch (err: any) {
    res.status(500).json({ error_fr: 'Erreur critique lors de la surveillance hebdomadaire.', details: err.message });
  }
}
