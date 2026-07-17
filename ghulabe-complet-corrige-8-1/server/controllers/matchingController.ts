import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { generateAuditLog } from '../utils/crypto';

type Speciality = 'AppSec' | 'DevSecOps' | 'Pentest' | 'Network Security';

const CATEGORY_TO_SPECIALITY: Record<string, Speciality> = {
  wordpress: 'AppSec',
  linux_server: 'DevSecOps',
  ssl_network: 'Network Security',
  general_pentest: 'Pentest',
};

/**
 * GET /api/missions/:id/matching-developers
 * Trouve les développeurs qualifiés pour une mission selon sa catégorie
 * (WordPress -> AppSec, Serveur Linux -> DevSecOps, SSL/Réseau -> Network Security).
 * Ne renvoie que les développeurs actifs ayant un abonnement actif
 * (subscription_active = true), condition pour recevoir des missions qualifiées.
 */
export async function getMatchingDevelopers(req: Request, res: Response): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const userId = req.user?.id;
  const role = req.user?.role;
  const missionId = req.params.id;

  if (!userId || !role) {
    res.status(401).json({
      error_fr: "🔒 Accès non autorisé : authentification requise.",
      error_en: "🔒 Unauthorized: authentication required.",
      code: 'UNAUTHORIZED_NO_TOKEN',
    });
    return;
  }

  try {
    const { data: mission, error: missionError } = await supabaseAdmin
      .from('missions')
      .select('id, client_id, category')
      .eq('id', missionId)
      .single();

    if (missionError || !mission) {
      res.status(404).json({
        error_fr: "Mission introuvable.",
        error_en: "Mission not found.",
      });
      return;
    }

    const targetSpeciality = CATEGORY_TO_SPECIALITY[mission.category] || 'Pentest';

    const { data: developers, error: devError } = await supabaseAdmin
      .from('developers')
      .select('id, name, speciality, badge_level, rating, missions_completed, status, subscription_active, country, city')
      .eq('status', 'active')
      .eq('subscription_active', true)
      .order('rating', { ascending: false });

    if (devError) {
      generateAuditLog({
        action: 'MATCHING_DEVELOPERS_DB_ERROR',
        userId,
        ipAddress: ip,
        status: 'FAILED',
        details: `Erreur Supabase lors du matching: ${devError.message}`,
      });
      res.status(500).json({
        error_fr: "Erreur lors de la recherche de développeurs.",
        error_en: "Error finding developers.",
        details: devError.message,
      });
      return;
    }

    const matched = (developers || []).sort((a: any, b: any) => {
      const aMatch = a.speciality === targetSpeciality ? 1 : 0;
      const bMatch = b.speciality === targetSpeciality ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return (b.rating || 0) - (a.rating || 0);
    });

    generateAuditLog({
      action: 'MATCHING_DEVELOPERS_ACCESSED',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Matching pour mission ${missionId}, catégorie: ${mission.category}, spécialité ciblée: ${targetSpeciality}, ${matched.length} développeur(s) trouvé(s).`,
    });

    res.status(200).json({ matched_speciality: targetSpeciality, developers: matched });
  } catch (err: any) {
    generateAuditLog({
      action: 'MATCHING_DEVELOPERS_FAILED',
      userId,
      ipAddress: ip,
      status: 'FAILED',
      details: `Erreur critique lors du matching: ${err.message}`,
    });
    res.status(500).json({
      error_fr: "Erreur critique lors du matching.",
      details: err.message,
    });
  }
}
