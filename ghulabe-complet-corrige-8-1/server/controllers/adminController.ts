import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendDevDecisionEmail } from '../services/emailService';

// Corrige un bug racine : cette fonction interrogeait auparavant une table
// `dev_applications` jamais alimentée nulle part dans le code (les inscriptions
// candidat vont réellement dans `users`, role='dev' — voir authController.register).
// C'est pour cette raison qu'aucune candidature n'apparaissait jamais côté admin.
export async function getPendingApps(req: Request, res: Response): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, phone, country, city, specialites, rate_fcfa, portfolio_url, bio, qcm_score_percentage, qcm_passed, verification_status, created_at')
    .eq('role', 'dev')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    res.status(500).json({ error_fr: "Erreur lors de la récupération des candidatures.", details: error.message });
    return;
  }

  const applications = (data || []).map((row: any) => ({
    ...row,
    speciality: (row.specialites && row.specialites[0]) || '',
    test_score: row.qcm_score_percentage ?? null,
  }));

  res.status(200).json({ applications });
}
export async function updateAppStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, reason } = req.body as { status: string; reason?: string };

  if (!['approved', 'rejected'].includes(status)) {
    res.status(400).json({ error_fr: "Statut invalide. Utilisez 'approved' ou 'rejected'." });
    return;
  }

  const updatePayload: Record<string, any> = {
    verification_status: status,
    verification_rejection_reason: status === 'rejected' ? (reason || null) : null,
  };
  if (status === 'approved') {
    updatePayload.badge_level = 'GHULABE CERTIFIED';
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updatePayload)
    .eq('id', id)
    .eq('role', 'dev')
    .select('id, name, email')
    .single();

  if (error) {
    res.status(500).json({ error_fr: "Erreur lors de la mise à jour du statut.", details: error.message });
    return;
  }

  res.status(200).json({ application: data });

  // Le candidat n'était auparavant jamais informé de la décision — il restait bloqué
  // sans savoir s'il était accepté. On l'informe désormais systématiquement par email.
  if (data?.email) {
    await sendDevDecisionEmail(
      data.email,
      data.name || '',
      status === 'approved',
      reason,
      'admin-decision',
      req.ip || 'unknown-ip'
    );
  }
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
