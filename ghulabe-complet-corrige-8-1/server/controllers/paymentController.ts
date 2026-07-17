import { Request, Response } from 'express';
import { generateAuditLog } from '../utils/crypto';
import { initiateMobileMoneyPayment, checkPaymentStatus, MobileMoneyOperator } from '../services/paymentService';

export async function startPayment(req: Request, res: Response): Promise<void> {
  const { amount, phoneNumber, operator, reference, description } = req.body;
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

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error_fr: "Montant invalide.", error_en: "Invalid amount." });
    return;
  }

  if (!phoneNumber || typeof phoneNumber !== 'string') {
    res.status(400).json({ error_fr: "Numéro de téléphone invalide.", error_en: "Invalid phone number." });
    return;
  }

  if (operator !== 'airtel' && operator !== 'moov') {
    res.status(400).json({
      error_fr: "Opérateur invalide. Valeurs acceptées : 'airtel' ou 'moov'.",
      error_en: "Invalid operator. Accepted values: 'airtel' or 'moov'.",
    });
    return;
  }

  if (!reference || typeof reference !== 'string') {
    res.status(400).json({ error_fr: "Référence de paiement manquante.", error_en: "Missing payment reference." });
    return;
  }

  try {
    const result = await initiateMobileMoneyPayment({
      amount,
      phoneNumber,
      operator: operator as MobileMoneyOperator,
      reference,
      description: description || '',
      userId,
      ip,
    });

    res.status(result.success ? 200 : 502).json(result);
  } catch (err: any) {
    generateAuditLog({
      action: 'PAYMENT_CONTROLLER_ERROR',
      userId,
      ipAddress: ip,
      status: 'FAILED',
      details: `Erreur critique dans startPayment: ${err.message}`,
    });
    res.status(500).json({ error_fr: "Erreur critique lors du paiement.", details: err.message });
  }
}

export async function getPaymentStatus(req: Request, res: Response): Promise<void> {
  const { transactionId } = req.params;
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

  if (!transactionId) {
    res.status(400).json({ error_fr: "ID de transaction manquant.", error_en: "Missing transaction ID." });
    return;
  }

  try {
    const result = await checkPaymentStatus(transactionId, userId, ip);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ error_fr: "Erreur lors de la vérification du statut.", details: err.message });
  }
}
