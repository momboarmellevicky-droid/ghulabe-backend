import { Request, Response } from 'express';
import { createCheckoutSession, verifyTransaction, isValidWebhookSignature } from '../services/flutterwaveService';
import { supabaseAdmin } from '../config/supabase';
import { generateAuditLog } from '../utils/crypto';
import { sendAdminRecruitmentAlertEmail } from '../services/emailService';
import { sendWhatsAppAlert } from '../services/whatsappService';

export async function startFlutterwaveCheckout(req: Request, res: Response): Promise<void> {
  const { plan, lang } = req.body;
  const userId = req.user?.id;
  const userEmail = req.user?.email;

  if (!userId || !userEmail) {
    res.status(401).json({
      error_fr: '🔒 Accès non autorisé : authentification requise pour effectuer un paiement.',
      error_en: '🔒 Unauthorized: authentication required to make a payment.',
      code: 'UNAUTHORIZED_NO_TOKEN',
    });
    return;
  }

  if (plan !== 'gardien' && plan !== 'pentest_premium') {
    res.status(400).json({
      error_fr: "Offre invalide. Valeurs acceptées : 'gardien' ou 'pentest_premium'.",
      error_en: "Invalid plan. Accepted values: 'gardien' or 'pentest_premium'.",
    });
    return;
  }

  try {
    const result = await createCheckoutSession({
      plan,
      userId,
      userEmail,
      lang: lang === 'en' ? 'en' : 'fr',
    });

    res.status(result.success ? 200 : 502).json(result);
  } catch (err: any) {
    res.status(500).json({ error_fr: 'Erreur critique lors du paiement.', details: err.message });
  }
}

/**
 * Applique le résultat d'une transaction Flutterwave revérifiée (jamais fait
 * confiance à autre chose que la réponse de l'API /verify elle-même) : si
 * réussie, met à jour le plan de l'utilisateur en base et notifie l'admin.
 * Réutilisé par la route de vérification (retour de redirection immédiat)
 * ET par le webhook (confirmation fiable même si le client ferme l'onglet).
 */
async function applyVerifiedPayment(transactionId: string): Promise<{
  success: boolean;
  status: string;
  plan?: 'gardien' | 'pentest_premium';
}> {
  const verified = await verifyTransaction(transactionId);

  if (!verified) {
    return { success: false, status: 'unknown' };
  }

  if (!verified.verified || verified.currency !== 'USD') {
    return { success: false, status: verified.status };
  }

  // tx_ref format: plan-<plan>-<userId>-<timestamp>
  const parts = verified.txRef.split('-');
  const plan = parts[1] as 'gardien' | 'pentest_premium' | undefined;
  const userId = parts[2];

  if (!userId || (plan !== 'gardien' && plan !== 'pentest_premium')) {
    return { success: false, status: verified.status };
  }

  const expectedAmount = plan === 'gardien' ? 9 : 42;
  if (verified.amount < expectedAmount) {
    generateAuditLog({
      action: 'FLW_AMOUNT_MISMATCH',
      userId,
      ipAddress: 'flutterwave-verify',
      status: 'BLOCKED',
      details: `Montant reçu (${verified.amount} USD) inférieur au montant attendu (${expectedAmount} USD) pour le plan ${plan}. Transaction: ${transactionId}.`,
    });
    return { success: false, status: 'amount_mismatch' };
  }

  const { error } = await supabaseAdmin.from('users').update({ plan }).eq('id', userId);

  if (error) {
    generateAuditLog({
      action: 'FLW_PLAN_UPDATE_FAILED',
      userId,
      ipAddress: 'flutterwave-verify',
      status: 'FAILED',
      details: `Échec de la mise à jour du plan après paiement Flutterwave confirmé : ${error.message}`,
    });
    return { success: false, status: 'db_error' };
  }

  generateAuditLog({
    action: 'FLW_PAYMENT_CONFIRMED',
    userId,
    ipAddress: 'flutterwave-verify',
    status: 'SUCCESS',
    details: `Paiement Flutterwave confirmé, plan mis à jour vers "${plan}". Transaction: ${transactionId}`,
  });

  await sendAdminRecruitmentAlertEmail(
    '💳 Paiement carte internationale confirmé (Flutterwave)',
    userId,
    `Plan: ${plan} | Transaction Flutterwave: ${transactionId}`,
    'admin-notify',
    'flutterwave-verify'
  );
  const adminPhone = process.env.ADMIN_WHATSAPP_E164;
  if (adminPhone) {
    await sendWhatsAppAlert(
      adminPhone,
      `💳 GHULABE\nPaiement carte internationale confirmé\nPlan: ${plan}`,
      'admin-notify',
      'flutterwave-verify'
    );
  }

  return { success: true, status: 'successful', plan };
}

/**
 * Appelée par le frontend juste après la redirection de retour Flutterwave,
 * pour donner un retour immédiat à l'utilisateur. Ne remplace pas le webhook
 * (qui reste la source de vérité en cas de fermeture d'onglet avant retour).
 */
export async function verifyFlutterwaveTransaction(req: Request, res: Response): Promise<void> {
  const { transactionId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      error_fr: '🔒 Accès non autorisé : authentification requise.',
      error_en: '🔒 Unauthorized: authentication required.',
      code: 'UNAUTHORIZED_NO_TOKEN',
    });
    return;
  }

  if (!transactionId) {
    res.status(400).json({ error_fr: 'ID de transaction manquant.', error_en: 'Missing transaction ID.' });
    return;
  }

  try {
    const result = await applyVerifiedPayment(transactionId);
    res.status(200).json({
      success: result.success,
      status: result.success ? 'success' : result.status,
      plan: result.plan,
      message_fr: result.success ? 'Paiement confirmé, offre activée !' : 'Paiement non confirmé.',
      message_en: result.success ? 'Payment confirmed, plan activated!' : 'Payment not confirmed.',
    });
  } catch (err: any) {
    res.status(500).json({ error_fr: 'Erreur lors de la vérification du paiement.', details: err.message });
  }
}

/**
 * Webhook Flutterwave — appelé directement par Flutterwave (pas par le
 * frontend GHULABE) lorsqu'un événement de paiement survient. Signature
 * vérifiée via l'en-tête verif-hash avant tout traitement.
 */
export async function flutterwaveWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers['verif-hash'] as string | undefined;

  if (!isValidWebhookSignature(signature)) {
    generateAuditLog({
      action: 'FLW_WEBHOOK_INVALID_SIGNATURE',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown-ip',
      status: 'BLOCKED',
      details: 'En-tête verif-hash manquant ou invalide sur un webhook Flutterwave.',
    });
    res.status(401).end();
    return;
  }

  const event = req.body;
  const transactionId = event?.data?.id;

  if (event?.event === 'charge.completed' && transactionId) {
    await applyVerifiedPayment(String(transactionId));
  }

  // Flutterwave exige un accusé de réception rapide (2xx) sous peine de retry.
  res.status(200).end();
}
