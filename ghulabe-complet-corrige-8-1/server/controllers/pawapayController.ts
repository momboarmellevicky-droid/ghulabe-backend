import { Request, Response } from 'express';
import { generateAuditLog } from '../utils/crypto';
import { initiatePawaPayDeposit, checkPawaPayStatus } from '../services/pawapayService';
import { supabaseAdmin } from '../config/supabase';

// Webhook appelé directement par PawaPay (pas d'authentification GHULABE possible ici,
// c'est PawaPay qui nous notifie) — configuré dans le dashboard PawaPay → Callback URLs.
export async function handlePawaPayCallback(req: Request, res: Response): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  try {
    const payload = req.body;
    const depositId = payload?.depositId;
    const status = payload?.status;

    generateAuditLog({
      action: 'PAWAPAY_CALLBACK_RECEIVED',
      userId: 'SYSTEM',
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Callback PawaPay reçu : depositId=${depositId}, status=${status}.`,
    });

    if (depositId) {
      await supabaseAdmin
        .from('pawapay_deposits')
        .update({ status, raw_callback: payload, updated_at: new Date().toISOString() })
        .eq('deposit_id', depositId);
    }

    // PawaPay attend un 200 pour ne pas renvoyer le callback en boucle
    res.status(200).json({ received: true });
  } catch (err: any) {
    generateAuditLog({
      action: 'PAWAPAY_CALLBACK_ERROR',
      userId: 'SYSTEM',
      ipAddress: ip,
      status: 'FAILED',
      details: `Erreur traitement callback PawaPay : ${err.message}`,
    });
    // On répond quand même 200 pour éviter un flood de retries PawaPay sur une erreur de notre côté
    res.status(200).json({ received: true, error: 'internal_logged' });
  }
}

export async function startPawaPayPayment(req: Request, res: Response): Promise<void> {
  const { amount, currency, phoneNumber, country, correspondent, reference, description } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      error_fr: "🔒 Accès non autorisé : authentification requise pour effectuer un paiement.",
      error_en: "🔒 Unauthorized: authentication required to make a payment.",
      code: 'UNAUTHORIZED_NO_TOKEN',
    });
    return;
  }

  if (!amount || !currency || !phoneNumber || !country || !correspondent || !reference) {
    res.status(400).json({
      error_fr: "Paramètres de paiement incomplets.",
      error_en: "Incomplete payment parameters.",
    });
    return;
  }

  try {
    const result = await initiatePawaPayDeposit({
      amount, currency, phoneNumber, country, correspondent, reference,
      description: description || '', userId, ip,
    });

    if (result.success && result.depositId) {
      await supabaseAdmin.from('pawapay_deposits').insert({
        deposit_id: result.depositId,
        user_id: userId,
        amount, currency, country, correspondent, reference,
        status: 'pending',
      });
    }

    res.status(result.success ? 200 : 502).json(result);
  } catch (err: any) {
    res.status(500).json({ error_fr: "Erreur critique lors du paiement.", details: err.message });
  }
}

export async function getPawaPayPaymentStatus(req: Request, res: Response): Promise<void> {
  const { depositId } = req.params;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error_fr: "🔒 Authentification requise.", error_en: "🔒 Authentication required." });
    return;
  }

  try {
    const result = await checkPawaPayStatus(depositId, userId, ip);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ error_fr: "Erreur lors de la vérification.", details: err.message });
  }
}
