import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { generateAuditLog } from '../utils/crypto';
import { runFullScan, runQuickHeartbeat } from '../services/scanEngine';
import { generateFindingsFromScan } from '../services/geminiAnalysis';
import { computeSecurityScore } from './scanController';
import { detectNewFindings } from '../utils/findingsDiff';
import { sendVulnerabilityAlertEmail } from '../services/emailService';
import { sendWhatsAppAlert } from '../services/whatsappService';

// Domaines de démonstration : leurs failles/incidents sont volontaires (pour
// illustrer le tableau de bord) et ne doivent jamais déclencher de vraie
// alerte email/WhatsApp vers l'utilisateur. Le scan, le score et le
// heartbeat restent affichés normalement, seul l'envoi de notification est
// coupé pour ces domaines.
const DEMO_DOMAINS = ['ebanking-pme-africa.sn', 'store-dakar-express.com', 'assurances-libreville.ga'];

function isDemoDomain(url: string): boolean {
  return DEMO_DOMAINS.some((demo) => url.includes(demo));
}

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

    res.status(202).json({ message: 'Surveillance hebdomadaire démarrée.' });

  const summary = { domainsScanned: 0, alertsSent: 0, errors: 0 };

  try {
    // 1. Récupère tous les domaines des utilisateurs abonnés au plan Gardien.
    const { data: gardienDomains, error: fetchError } = await supabaseAdmin
      .from('domains')
      .select('id, url, user_id, certified, users!inner(id, email, phone, name, plan)')
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
          compliance_status: isCertified ? 'conforme' : score >= 5 ? 'en_cours' : 'non_conforme',
          was_certified_before: isCertified || domain.certified === true,
        })
        
          .eq('id', domain.id);

        await supabaseAdmin.from('scans').insert({ domain_id: domain.id, score, findings });
        summary.domainsScanned += 1;

        // 4. Détecte les nouvelles failles par rapport au scan précédent.
        const previousFindings = previousScan?.findings || [];
        const newFindings = detectNewFindings(previousFindings, findings);

        if (newFindings.length > 0 && isDemoDomain(domain.url)) {
          generateAuditLog({
            action: 'WEEKLY_MONITORING_DEMO_ALERT_SKIPPED',
            userId: owner?.id,
            ipAddress: 'CRON_WEEKLY',
            targetUrl: domain.url,
            status: 'SUCCESS',
            details: `Domaine de démo : score/scan mis à jour normalement, alerte email/WhatsApp volontairement non envoyée.`,
          });
        } else if (newFindings.length > 0) {
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

    } catch (err: any) {
    generateAuditLog({ action: 'WEEKLY_MONITORING_FAILED', ipAddress: 'CRON_WEEKLY', status: 'FAILED', details: `Erreur critique: ${err.message}` });
  }
}

/**
 * POST /api/cron/quick-heartbeat
 * Point d'entrée protégé par le même secret partagé (header x-cron-secret) que
 * la surveillance hebdomadaire, mais conçu pour être appelé toutes les 15-30
 * minutes par le déclencheur externe (cron-job.org). Volontairement léger
 * (pas de scan de ports/fichiers/DNS) pour supporter cette fréquence sans
 * surcharger les domaines cibles ni le service.
 *
 * Détecte trois types d'incident entre deux scans hebdomadaires complets :
 * 1. Site hors ligne (panne, DDoS, expiration serveur)
 * 2. Certificat SSL qui devient invalide brutalement
 * 3. Défacement / injection de contenu (hash de la page d'accueil qui change
 *    de façon inattendue par rapport au dernier heartbeat)
 */
export async function runQuickHeartbeatCron(req: Request, res: Response): Promise<void> {
  const providedSecret = req.headers['x-cron-secret'];
  if (!process.env.CRON_SECRET || providedSecret !== process.env.CRON_SECRET) {
    res.status(401).json({ error_fr: 'Non autorisé.', error_en: 'Unauthorized.' });
    return;
  }

  res.status(202).json({ message: 'Heartbeat rapide démarré.' });

  const summary = { domainsChecked: 0, alertsSent: 0, errors: 0 };

  try {
    const { data: gardienDomains, error: fetchError } = await supabaseAdmin
      .from('domains')
      .select('id, url, user_id, content_hash, was_online, was_ssl_valid, users!inner(id, email, phone, name, plan)')
      .eq('users.plan', 'gardien');

    if (fetchError) throw fetchError;

    for (const domain of gardienDomains || []) {
      const owner: any = Array.isArray((domain as any).users) ? (domain as any).users[0] : (domain as any).users;
      try {
        const hostname = domain.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const heartbeat = await runQuickHeartbeat(hostname);
        summary.domainsChecked += 1;

        const alerts: { severity: 'critique' | 'moyen'; messageFr: string; messageEn: string }[] = [];

        // 1. Site tombé hors ligne alors qu'il était en ligne au check précédent
        if (!heartbeat.is_online && domain.was_online !== false) {
          alerts.push({
            severity: 'critique',
            messageFr: `🔴 GHULABE ALERTE : ${domain.url} est INACCESSIBLE (détecté en quasi temps réel). Vérifiez immédiatement votre hébergement.`,
            messageEn: `🔴 GHULABE ALERT: ${domain.url} is DOWN (detected in near real-time). Check your hosting immediately.`,
          });
        }

        // 2. Certificat SSL devenu invalide — n'alerte qu'au moment où l'état bascule
        // (était valide ou jamais vérifié -> devient invalide), pas à chaque passage
        // du heartbeat tant que le problème persiste (évite les rafales du même mail).
        if (heartbeat.is_online && !heartbeat.ssl_valid && domain.was_ssl_valid !== false) {
          alerts.push({
            severity: 'critique',
            messageFr: `🔴 GHULABE ALERTE : Le certificat SSL de ${domain.url} est INVALIDE. Vos visiteurs voient un avertissement de sécurité.`,
            messageEn: `🔴 GHULABE ALERT: SSL certificate for ${domain.url} is INVALID. Visitors are seeing a security warning.`,
          });
        }

        // 3. Contenu de la page d'accueil radicalement changé (défacement probable)
        if (
          heartbeat.is_online &&
          heartbeat.content_hash &&
          domain.content_hash &&
          domain.content_hash !== heartbeat.content_hash
        ) {
          alerts.push({
            severity: 'critique',
            messageFr: `🔴 GHULABE ALERTE : Le contenu de la page d'accueil de ${domain.url} a changé de façon inattendue. Vérifiez qu'il ne s'agit pas d'un piratage (défacement).`,
            messageEn: `🔴 GHULABE ALERT: The homepage content of ${domain.url} changed unexpectedly. Check for a possible defacement/hack.`,
          });
        }

        // Met à jour l'état de référence pour le prochain heartbeat
        await supabaseAdmin
          .from('domains')
          .update({
            was_online: heartbeat.is_online,
            was_ssl_valid: heartbeat.ssl_valid,
            content_hash: heartbeat.content_hash || domain.content_hash,
            last_heartbeat_at: heartbeat.checked_at,
          })
          .eq('id', domain.id);

        for (const alert of alerts) {
          await supabaseAdmin.from('alerts').insert({
            domain_id: domain.id,
            user_id: owner.id,
            severity: alert.severity,
            message: alert.messageFr,
            message_fr: alert.messageFr,
            message_en: alert.messageEn,
            is_read: false,
          });

          if (isDemoDomain(domain.url)) {
            generateAuditLog({
              action: 'QUICK_HEARTBEAT_DEMO_ALERT_SKIPPED',
              userId: owner?.id,
              ipAddress: 'CRON_HEARTBEAT',
              targetUrl: domain.url,
              status: 'SUCCESS',
              details: `Domaine de démo : incident affiché normalement, alerte email/WhatsApp volontairement non envoyée.`,
            });
            continue;
          }

          const emailSent = await sendVulnerabilityAlertEmail(
            owner.email,
            domain.url,
            1,
            alert.severity === 'critique' ? 1 : 0,
            0,
            'fr',
            owner.id,
            'CRON_HEARTBEAT'
          );
          if (emailSent) summary.alertsSent += 1;

          if (owner.phone) {
            await sendWhatsAppAlert(owner.phone, alert.messageFr, owner.id, 'CRON_HEARTBEAT');
          }
        }
      } catch (domainErr: any) {
        summary.errors += 1;
        generateAuditLog({
          action: 'QUICK_HEARTBEAT_DOMAIN_FAILED',
          userId: owner?.id,
          ipAddress: 'CRON_HEARTBEAT',
          targetUrl: domain.url,
          status: 'FAILED',
          details: `Échec heartbeat pour ${domain.url}: ${domainErr.message}`,
        });
      }
    }

    generateAuditLog({
      action: 'QUICK_HEARTBEAT_COMPLETED',
      ipAddress: 'CRON_HEARTBEAT',
      status: 'SUCCESS',
      details: `Heartbeat terminé : ${summary.domainsChecked} domaine(s) vérifié(s), ${summary.alertsSent} alerte(s) envoyée(s), ${summary.errors} erreur(s).`,
    });
  } catch (err: any) {
    generateAuditLog({ action: 'QUICK_HEARTBEAT_FAILED', ipAddress: 'CRON_HEARTBEAT', status: 'FAILED', details: `Erreur critique: ${err.message}` });
  }
}
