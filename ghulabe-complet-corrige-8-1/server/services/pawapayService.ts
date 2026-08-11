import { generateAuditLog } from '../utils/crypto';

// ============================================================================
// GHULABE — PASSERELLE DE PAIEMENT PAWAPAY (zone CFA élargie, hors Gabon)
//
// SingPay reste le canal principal pour le Gabon (server/services/paymentService.ts).
// PawaPay s'ajoute UNIQUEMENT pour les autres pays (Cameroun, Sénégal, Côte
// d'Ivoire, etc.) — aucun des deux systèmes ne remplace l'autre.
//
// Environnement SANDBOX (test) tant que PAWAPAY_ENV != 'production'.
// Doc API v2 : https://docs.pawapay.io/v2/api-reference/deposits/initiate-deposit
// ============================================================================

const PAWAPAY_API_TOKEN = process.env.PAWAPAY_API_TOKEN;
const PAWAPAY_ENV = process.env.PAWAPAY_ENV || 'sandbox';
const PAWAPAY_BASE_URL = PAWAPAY_ENV === 'production'
  ? 'https://api.pawapay.io'
  : 'https://api.sandbox.pawapay.io';

export interface PawaPayDepositParams {
  amount: number; // en devise locale (ex: XAF, XOF)
  currency: string; // ex: 'XAF', 'XOF'
  phoneNumber: string; // format E.164 sans le '+', ex: 237xxxxxxxxx
  country: string; // code pays ISO 3166-1 alpha-2, ex: 'CM', 'CI', 'SN'
  correspondent: string; // opérateur PawaPay, ex: 'MTN_MOMO_CMR', 'ORANGE_CIV'
  reference: string;
  description: string;
  userId: string;
  ip: string;
}

export interface PawaPayResult {
  success: boolean;
  depositId?: string;
  status: 'pending' | 'success' | 'failed';
  message_fr: string;
  message_en: string;
  raw?: unknown;
}

function isConfigured(): boolean {
  return Boolean(PAWAPAY_API_TOKEN);
}

export async function initiatePawaPayDeposit(params: PawaPayDepositParams): Promise<PawaPayResult> {
  const { amount, currency, phoneNumber, country, correspondent, reference, userId, ip } = params;

  if (!isConfigured()) {
    generateAuditLog({
      action: 'PAWAPAY_NOT_CONFIGURED',
      userId,
      ipAddress: ip,
      status: 'BLOCKED',
      details: `Tentative de paiement PawaPay (${country}) alors que PAWAPAY_API_TOKEN est absent.`,
    });
    return {
      success: false,
      status: 'failed',
      message_fr: "Paiement international temporairement indisponible. Réessayez plus tard ou contactez le support.",
      message_en: "International payment temporarily unavailable. Try again later or contact support.",
    };
  }

  try {
    const depositId = crypto.randomUUID();

    const res = await fetch(`${PAWAPAY_BASE_URL}/deposits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAWAPAY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        depositId,
        amount: String(amount),
        currency,
        correspondent,
        payer: {
          type: 'MSISDN',
          address: { value: phoneNumber },
        },
        customerTimestamp: new Date().toISOString(),
        statementDescription: 'GHULABE GARDIEN',
        metadata: [
          { fieldName: 'reference', fieldValue: reference },
          { fieldName: 'country', fieldValue: country },
        ],
      }),
    });

    const data: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      generateAuditLog({
        action: 'PAWAPAY_DEPOSIT_FAILED',
        userId,
        ipAddress: ip,
        status: 'FAILED',
        details: `Échec initiation PawaPay (${country}/${correspondent}) : ${res.status} ${JSON.stringify(data)}`,
      });
      return {
        success: false,
        status: 'failed',
        message_fr: "Le paiement Mobile Money a échoué. Vérifiez le numéro et réessayez.",
        message_en: "Mobile money payment failed. Check the number and try again.",
        raw: data,
      };
    }

    generateAuditLog({
      action: 'PAWAPAY_DEPOSIT_INITIATED',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Paiement PawaPay initié : ${depositId} (${country}/${correspondent}, ${amount} ${currency}).`,
    });

    return {
      success: true,
      depositId,
      status: 'pending',
      message_fr: "Paiement initié. Confirmez la transaction sur votre téléphone.",
      message_en: "Payment initiated. Confirm the transaction on your phone.",
      raw: data,
    };
  } catch (err: any) {
    generateAuditLog({
      action: 'PAWAPAY_DEPOSIT_ERROR',
      userId,
      ipAddress: ip,
      status: 'FAILED',
      details: `Erreur critique PawaPay (${country}) : ${err.message}`,
    });
    return {
      success: false,
      status: 'failed',
      message_fr: "Erreur technique lors du paiement. Réessayez.",
      message_en: "Technical error during payment. Please try again.",
    };
  }
}

export async function checkPawaPayStatus(depositId: string, userId: string, ip: string): Promise<PawaPayResult> {
  if (!isConfigured()) {
    return {
      success: false,
      status: 'failed',
      message_fr: "Vérification indisponible.",
      message_en: "Status check unavailable.",
    };
  }

  try {
    const res = await fetch(`${PAWAPAY_BASE_URL}/deposits/${depositId}`, {
      headers: { 'Authorization': `Bearer ${PAWAPAY_API_TOKEN}` },
    });
    const data: any = await res.json().catch(() => ({}));
    const pawapayStatus = data?.status; // COMPLETED | FAILED | PENDING (sandbox/v2)

    const status: PawaPayResult['status'] =
      pawapayStatus === 'COMPLETED' ? 'success' :
      pawapayStatus === 'FAILED' ? 'failed' : 'pending';

    generateAuditLog({
      action: 'PAWAPAY_STATUS_CHECKED',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Statut PawaPay ${depositId} : ${pawapayStatus}.`,
    });

    return {
      success: true,
      depositId,
      status,
      message_fr: status === 'success' ? "Paiement confirmé." : status === 'failed' ? "Paiement échoué." : "Paiement en attente.",
      message_en: status === 'success' ? "Payment confirmed." : status === 'failed' ? "Payment failed." : "Payment pending.",
      raw: data,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'failed',
      message_fr: "Erreur lors de la vérification.",
      message_en: "Error checking status.",
    };
  }
}
