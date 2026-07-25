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
import { sendOtpEmail } from '../services/emailService';

const pendingAdminOtps = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

export async function requestAdminOtp(req: Request, res: Response): Promise<void> {
  const userEmail = (req as any).user?.email;
  if (!userEmail) {
    res.status(401).json({ error_fr: "Session invalide." });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  pendingAdminOtps.set(userEmail, { otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 });

  const sent = await sendOtpEmail(userEmail, otp, 'fr', userEmail, req.ip || 'unknown-ip');

  res.status(200).json({
    message_fr: sent
      ? "Code envoyé par email. Vérifiez votre boîte de réception."
      : "Code généré (email non envoyé, environnement de test).",
    emailSent: sent,
  });
}

export async function verifyAdminOtp(req: Request, res: Response): Promise<void> {
  const userEmail = (req as any).user?.email;
  const { otp } = req.body;

  const challenge = pendingAdminOtps.get(userEmail);
  if (!challenge || Date.now() > challenge.expiresAt) {
    res.status(401).json({ error_fr: "Code expiré. Redemandez un nouveau code." });
    return;
  }
  if (challenge.attempts >= 5) {
    pendingAdminOtps.delete(userEmail);
    res.status(429).json({ error_fr: "Trop de tentatives. Redemandez un nouveau code." });
    return;
  }
  if (challenge.otp !== otp) {
    challenge.attempts += 1;
    res.status(401).json({ error_fr: "Code incorrect." });
    return;
  }

  pendingAdminOtps.delete(userEmail);
  res.status(200).json({ verified: true });
}
export async function getDevList(req: Request, res: Response): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, country, city, rate_fcfa, portfolio_url, badge_level, rating, missions_completed, specialites, is_suspended, created_at')
    .eq('role', 'developer')
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error_fr: "Erreur lors de la récupération des développeurs.", details: error.message });
    return;
  }

  res.status(200).json({ developers: data });
}

export async function toggleSuspendDev(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { suspend } = req.body;

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ is_suspended: suspend })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error_fr: "Erreur lors de la mise à jour du statut.", details: error.message });
    return;
  }

  res.status(200).json({ developer: data });
}
