import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { generateAuditLog } from '../utils/crypto';

/**
 * GET /api/missions
 * Renvoie les missions visibles par l'utilisateur authentifié, adaptées à son rôle :
 * - client ('user')  : uniquement ses propres missions (client_id = userId)
 * - développeur ('dev') : les missions ouvertes au marché (status = 'requested', pas encore
 *   assignées) + celles qui lui sont déjà assignées (assigned_dev_id = userId)
 * - admin            : toutes les missions, sans filtre
 *
 * Colonnes réelles confirmées (schéma Supabase) : id, client_id, developer_id, description,
 * url, urgency, budget_fcfa, status, legal_checkbox_accepted, created_at, alert_id,
 * client_name, developer_name, rating_stars, rating_review, updated_at, assigned_dev_id.
 */
export async function getMissions(req: Request, res: Response): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const userId = req.user?.id;
  const role = req.user?.role;

  // requireAuth garantit normalement req.user, mais on vérifie quand même par défense en profondeur.
  if (!userId || !role) {
    res.status(401).json({
      error_fr: "🔒 Accès non autorisé : authentification requise pour consulter les missions.",
      error_en: "🔒 Unauthorized: authentication required to view missions.",
      code: 'UNAUTHORIZED_NO_TOKEN',
    });
    return;
  }

  try {
    let query = supabaseAdmin
      .from('missions')
      .select(
        'id, client_id, client_name, developer_id, developer_name, assigned_dev_id, description, url, urgency, budget_fcfa, status, legal_checkbox_accepted, rating_stars, rating_review, alert_id, created_at, updated_at'
      )
      .order('created_at', { ascending: false });

    if (role === 'admin') {
      // Aucun filtre : vue complète pour l'administration.
    } else if (role === 'dev') {
      // Marché ouvert (pas encore assigné) + missions déjà assignées à ce développeur.
      query = query.or(`status.eq.requested,assigned_dev_id.eq.${userId}`);
    } else {
      // Client standard ('user') : uniquement ses propres missions.
      query = query.eq('client_id', userId);
    }

    const { data: missions, error } = await query;

    if (error) {
      generateAuditLog({
        action: 'MISSIONS_LIST_DB_ERROR',
        userId,
        ipAddress: ip,
        status: 'FAILED',
        details: `Erreur Supabase lors de la lecture des missions: ${error.message}`,
      });
      res.status(500).json({ error_fr: "Erreur lors de la lecture des missions.", error_en: "Error reading missions.", details: error.message });
      return;
    }

    generateAuditLog({
      action: 'MISSIONS_LIST_ACCESSED',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Consultation de la liste des missions (${missions?.length ?? 0} résultat(s), rôle: ${role}).`,
    });

    res.status(200).json({ missions: missions || [] });
  } catch (err: any) {
    generateAuditLog({
      action: 'MISSIONS_LIST_FAILED',
      userId,
      ipAddress: ip,
      status: 'FAILED',
      details: `Erreur critique lors de la lecture des missions: ${err.message}`,
    });
    res.status(500).json({ error_fr: "Erreur critique lors de la lecture des missions.", details: err.message });
  }
}
