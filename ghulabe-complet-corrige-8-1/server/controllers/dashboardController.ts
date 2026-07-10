import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { generateAuditLog } from '../utils/crypto';

/**
 * GET /api/dashboard
 * Remplace les 3 appels Supabase directs auparavant faits depuis DashboardView.tsx (côté client,
 * via le client anon + RLS + auth.uid()) — cassés depuis que le front n'ouvre plus de session
 * Supabase Auth (voir AuthView.tsx, refonte de ce soir sur le vrai JWT backend).
 *
 * Corrige au passage un bug réel : l'ancien code faisait
 * `supabase.from('scans').select('*').eq('user_id', ...)`, alors que la table `scans` n'a PAS
 * de colonne `user_id` (colonnes réelles : id, domain_id, score, findings, report_pdf_url,
 * created_at). Cette requête échouait silencieusement à chaque appel. Ici, le nombre de scans
 * est calculé correctement via une jointure sur les domaines de l'utilisateur.
 */
export async function getDashboardData(req: Request, res: Response): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      error_fr: "🔒 Accès non autorisé : authentification requise.",
      error_en: "🔒 Unauthorized: authentication required.",
      code: 'UNAUTHORIZED_NO_TOKEN',
    });
    return;
  }

  try {
    const { data: domains, error: domainsError } = await supabaseAdmin
      .from('domains')
      .select('id, user_id, url, last_scan, score, status, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (domainsError) throw domainsError;

    const { data: alerts, error: alertsError } = await supabaseAdmin
      .from('alerts')
      .select('id, domain_id, user_id, severity, message, message_fr, message_en, is_read, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (alertsError) throw alertsError;

    // Nombre de scans : jointure manuelle via les domain_id de l'utilisateur (scans n'a pas
    // de user_id direct). Si l'utilisateur n'a aucun domaine, on renvoie 0 sans requêter.
    const domainIds = (domains || []).map((d) => d.id);
    let scansCount = 0;
    if (domainIds.length > 0) {
      const { count, error: scansError } = await supabaseAdmin
        .from('scans')
        .select('id', { count: 'exact', head: true })
        .in('domain_id', domainIds);
      if (scansError) throw scansError;
      scansCount = count || 0;
    }

    generateAuditLog({
      action: 'DASHBOARD_DATA_ACCESSED',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Consultation dashboard (${domains?.length ?? 0} domaine(s), ${alerts?.length ?? 0} alerte(s), ${scansCount} scan(s)).`,
    });

    res.status(200).json({
      domains: domains || [],
      alerts: alerts || [],
      scansCount,
    });
  } catch (err: any) {
    generateAuditLog({
      action: 'DASHBOARD_DATA_FAILED',
      userId,
      ipAddress: ip,
      status: 'FAILED',
      details: `Erreur lors de la lecture du dashboard: ${err.message}`,
    });
    res.status(500).json({ error_fr: "Erreur lors de la lecture du tableau de bord.", details: err.message });
  }
}
