import { Request, Response } from 'express';
import { createCheckoutSession, constructWebhookEvent } from '../services/stripeService';
import { supabaseAdmin } from '../config/supabase';
import { generateAuditLog } from '../utils/crypto';
import { sendAdminRecruitmentAlertEmail } from '../services/emailService';
import { sendWhatsAppAlert } from '../services/whatsappService';

export async function startStripeCheckout(req: Request, res: Response): Promise<void> {
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
 * Webhook Stripe — appelé directement par Stripe (pas par le frontend GHULABE)
 * lorsqu'un paiement est confirmé. C'est ICI, et seulement ici, que le plan de
 * l'utilisateur est mis à jour en base : on ne fait jamais confiance au
 * navigateur du client pour confirmer qu'un paiement a réussi.
 */
export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers['stripe-signature'] as string | undefined;

  if (!signature) {
    res.status(400).json({ error: 'Signature Stripe manquante.' });
    return;
  }

  let event;
  try {
    event = constructWebhookEvent(req.body as Buffer, signature);
  } catch (err: any) {
    generateAuditLog({
      action: 'STRIPE_WEBHOOK_INVALID_SIGNATURE',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown-ip',
      status: 'BLOCKED',
      details: `Signature webhook Stripe invalide : ${err.message}`,
    });
    res.status(400).json({ error: `Webhook signature invalide: ${err.message}` });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;

    if (userId && (plan === 'gardien' || plan === 'pentest_premium')) {
      const { error } = await supabaseAdmin.from('users').update({ plan }).eq('id', userId);

      if (error) {
        generateAuditLog({
          action: 'STRIPE_PLAN_UPDATE_FAILED',
          userId,
          ipAddress: 'stripe-webhook',
          status: 'FAILED',
          details: `Échec de la mise à jour du plan après paiement Stripe confirmé : ${error.message}`,
        });
      } else {
        generateAuditLog({
          action: 'STRIPE_PAYMENT_CONFIRMED',
          userId,
          ipAddress: 'stripe-webhook',
          status: 'SUCCESS',
          details: `Paiement Stripe confirmé, plan mis à jour vers "${plan}". Session: ${session.id}`,
        });

        await sendAdminRecruitmentAlertEmail(
          '💳 Paiement carte internationale confirmé (Stripe)',
          userId,
          `Plan: ${plan} | Session Stripe: ${session.id}`,
          'admin-notify',
          'stripe-webhook'
        );
        const adminPhone = process.env.ADMIN_WHATSAPP_E164;
        if (adminPhone) {
          await sendWhatsAppAlert(
            adminPhone,
            `💳 GHULABE\nPaiement carte internationale confirmé\nPlan: ${plan}`,
            'admin-notify',
            'stripe-webhook'
          );
        }
      }
    }
  }

  res.status(200).json({ received: true });
}
