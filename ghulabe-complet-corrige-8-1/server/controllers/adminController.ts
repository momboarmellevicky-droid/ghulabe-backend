import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export async function getPendingApps(req: Request, res: Response): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('dev_applications')
    .select('id, name, email, country, city, speciality, languages, rate_fcfa, experience, portfolio, bio, smile_identity_status, created_at')
    .eq('smile_identity_status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    res.status(500).json({ error_fr: "Erreur lors de la récupération des candidatures.", details: error.message });
    return;
  }

  res.status(200).json({ applications: data });
}
export async function updateAppStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    res.status(400).json({ error_fr: "Statut invalide. Utilisez 'approved' ou 'rejected'." });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('dev_applications')
    .update({ smile_identity_status: status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error_fr: "Erreur lors de la mise à jour du statut.", details: error.message });
    return;
  }

  res.status(200).json({ application: data });
}
