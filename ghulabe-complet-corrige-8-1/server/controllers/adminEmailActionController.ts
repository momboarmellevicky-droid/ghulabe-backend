import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendDevDecisionEmail } from '../services/emailService';
import { generateAuditLog } from '../utils/crypto';

// ============================================================================
// Certification développeur EN UN CLIC depuis l'email admin (sans passer par
// le dashboard). Chaque candidat reçoit DEUX liens distincts avec des jetons
// aléatoires à usage unique (pas un simple paramètre ?action=approve/reject
// modifiable dans l'URL — le jeton lui-même détermine l'action côté serveur).
// Jetons invalidés après un clic OU après 7 jours (voir generateAdminActionTokens).
// ============================================================================

function renderResultPage(title: string, message: string, success: boolean): string {
  const color = success ? '#00FF88' : '#FF4444';
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — GHULABE</title></head>
<body style="font-family:sans-serif;background:#0A0A0F;color:#F3F4F6;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center;">
  <div>
    <h1 style="color:${color};">${title}</h1>
    <p style="color:#9CA3AF;font-size:1.1em;">${message}</p>
  </div>
</body></html>`;
}

export async function certifyDeveloperViaEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.query as { token?: string };
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!token) {
    res.status(400).send(renderResultPage('Lien invalide', 'Aucun jeton fourni.', false));
    return;
  }

  const { data: candidate } = await supabaseAdmin
    .from('users')
    .select('id, name, email, admin_action_token_expires_at')
    .eq('admin_approve_token', token)
    .eq('role', 'dev')
    .maybeSingle();

  if (!candidate || (candidate.admin_action_token_expires_at && new Date(candidate.admin_action_token_expires_at) < new Date())) {
    res.status(410).send(renderResultPage('Lien expiré ou déjà utilisé', 'Cette certification a peut-être déjà été traitée, ou le lien a expiré (7 jours). Utilisez le dashboard admin si besoin.', false));
    return;
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      verification_status: 'approved',
      badge_level: 'GHULABE CERTIFIED',
      admin_approve_token: null,
      admin_reject_token: null,
      admin_action_token_expires_at: null,
    })
    .eq('id', candidate.id);

  if (error) {
    res.status(500).send(renderResultPage('Erreur', "La certification n'a pas pu être enregistrée. Réessayez depuis le dashboard.", false));
    return;
  }

  generateAuditLog({
    action: 'DEV_CERTIFIED_VIA_EMAIL_LINK',
    userId: candidate.id,
    ipAddress: ip,
    status: 'SUCCESS',
    details: `Développeur ${candidate.email} certifié GHULABE CERTIFIED via le lien email (sans dashboard).`,
  });

  await sendDevDecisionEmail(candidate.email, candidate.name || '', true, undefined, 'admin-email-link', ip);

  res.status(200).send(renderResultPage('✅ Développeur certifié', `${candidate.name || candidate.email} a reçu le badge GHULABE CERTIFIED et a été notifié par email.`, true));
}

export async function rejectDeveloperViaEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.query as { token?: string };
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!token) {
    res.status(400).send(renderResultPage('Lien invalide', 'Aucun jeton fourni.', false));
    return;
  }

  const { data: candidate } = await supabaseAdmin
    .from('users')
    .select('id, name, email, admin_action_token_expires_at')
    .eq('admin_reject_token', token)
    .eq('role', 'dev')
    .maybeSingle();

  if (!candidate || (candidate.admin_action_token_expires_at && new Date(candidate.admin_action_token_expires_at) < new Date())) {
    res.status(410).send(renderResultPage('Lien expiré ou déjà utilisé', 'Cette décision a peut-être déjà été traitée, ou le lien a expiré (7 jours). Utilisez le dashboard admin si besoin.', false));
    return;
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      verification_status: 'rejected',
      admin_approve_token: null,
      admin_reject_token: null,
      admin_action_token_expires_at: null,
    })
    .eq('id', candidate.id);

  if (error) {
    res.status(500).send(renderResultPage('Erreur', "Le rejet n'a pas pu être enregistré. Réessayez depuis le dashboard.", false));
    return;
  }

  generateAuditLog({
    action: 'DEV_REJECTED_VIA_EMAIL_LINK',
    userId: candidate.id,
    ipAddress: ip,
    status: 'SUCCESS',
    details: `Candidature de ${candidate.email} rejetée via le lien email (sans dashboard).`,
  });

  await sendDevDecisionEmail(candidate.email, candidate.name || '', false, undefined, 'admin-email-link', ip);

  res.status(200).send(renderResultPage('❌ Candidature rejetée', `${candidate.name || candidate.email} a été notifié(e) par email.`, true));
}
