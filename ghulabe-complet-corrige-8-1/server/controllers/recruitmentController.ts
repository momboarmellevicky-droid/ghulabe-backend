import { Request, Response } from 'express';
import { initiateMobileMoneyPayment, checkPaymentStatus, MobileMoneyOperator } from '../services/paymentService';
import { generateAuditLog } from '../utils/crypto';

const RECRUITMENT_FEE_FCFA = 5000;

export async function startRecruitmentPayment(req: Request, res: Response): Promise<void> {
  const { email, phoneNumber, operator } = req.body as { email: string; phoneNumber: string; operator: MobileMoneyOperator };
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  if (!email || !phoneNumber || !operator) {
    res.status(400).json({ error_fr: "Email, numéro de téléphone et opérateur requis." });
    return;
  }

  const result = await initiateMobileMoneyPayment({
    amount: RECRUITMENT_FEE_FCFA,
    phoneNumber,
    operator,
    reference: `recrutement-dev-${Date.now()}`,
    description: `Frais de recrutement développeur GHULABE (${email})`,
    userId: email,
    ip,
  });

  res.status(result.success ? 200 : 400).json(result);
}

export async function getRecruitmentPaymentStatus(req: Request, res: Response): Promise<void> {
  const { transactionId } = req.params;
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';

  const result = await checkPaymentStatus(transactionId, 'recruitment-candidate', ip);
  res.status(result.success ? 200 : 400).json(result);
}
