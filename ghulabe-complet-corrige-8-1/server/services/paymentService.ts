import { generateAuditLog } from '../utils/crypto';

// ============================================================================
// GHULABE — PASSERELLE DE PAIEMENT SINGPAY (Airtel Money / Moov Money Gabon)
//
// Confirmé le 17/07/2026 via la documentation Swagger officielle SingPay
// (client.singpay.ga) :
// - L'opérateur est choisi via l'ENDPOINT lui-même, pas via un champ
//   "disbursement" :
//     POST /v1/74/paiement  → Airtel Money
//     POST /v1/62/paiement  → Moov Money
// - Vérification de statut : GET /v1/transaction/api/status/{id}
// ============================================================================

const SINGPAY_ENDPOINT_AIRTEL = 'https://gateway.singpay.ga/v1/74/paiement';
const SINGPAY_ENDPOINT_MOOV = 'https://gateway.singpay.ga/v1/62/paiement';
const SINGPAY_STATUS_URL = 'https://gateway.singpay.ga/v1/transaction/api/status';
const SINGPAY_CLIENT_ID = process.env.SINGPAY_API_KEY;
const SINGPAY_CLIENT_SECRET = process.env.SINGPAY_SECRET_KEY;
const SINGPAY_WALLET_ID = process.env.SINGPAY_WALLET_ID;
const PAYMENT_TIMEOUT_MS = 30000;

export type MobileMoneyOperator = 'airtel' | 'moov';

export interface InitiatePaymentParams {
  amount: number; // en FCFA (XAF)
  phoneNumber: string; // client_msisdn
  operator: MobileMoneyOperator;
  reference: string; // référence interne GHULABE (ex: dev application id, mission id)
  description: string;
  userId: string;
  ip: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status: 'pending' | 'success' | 'failed';
  message_fr: string;
  message_en: string;
  raw?: unknown; // réponse brute SingPay, utile tant que son format exact n'est pas confirmé
}

function isConfigured(): boolean {
  return Boolean(SINGPAY_CLIENT_ID && SINGPAY_CLIENT_SECRET && SINGPAY_WALLET_ID);
}

function endpointFor(operator: MobileMoneyOperator): string {
  return operator === 'airtel' ? SINGPAY_ENDPOINT_AIRTEL : SINGPAY_ENDPOINT_MOOV;
}

/**
 * Initie un paiement Mobile Money (Airtel Money ou Moov Money) via SingPay.
 * Endpoint choisi selon l'opérateur (voir documentation Swagger officielle).
 */
export async function initiateMobileMoneyPayment(params: InitiatePaymentParams): Promise<PaymentResult> {
  const { amount, phoneNumber, operator, reference, userId, ip } = params;

  if (!isConfigured()) {
    generateAuditLog({
      action: 'PAYMENT_SKIPPED_NOT_CONFIGURED',
      userId,
      ipAddress: ip,
      status: 'BLOCKED',
      details: 'SINGPAY_API_KEY/SECRET_KEY/WALLET_ID absents de .env. Paiement non initié.',
    });

    return {
      success: false,
      status: 'failed',
      message_fr: "Passerelle de paiement non configurée. Contactez l'administrateur.",
      message_en: 'Payment gateway not configured. Contact the administrator.',
    };
  }

  const endpoint = endpointFor(operator);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PAYMENT_TIMEOUT_MS);

  try {
    generateAuditLog({
      action: 'PAYMENT_INITIATED',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Paiement ${operator.toUpperCase()} initié : ${amount} FCFA (réf: ${reference}).`,
    });

    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': SINGPAY_CLIENT_ID as string,
        'x-client-secret': SINGPAY_CLIENT_SECRET as string,
        'x-wallet': SINGPAY_WALLET_ID as string,
      },
      body: JSON.stringify({
        amount,
        reference,
        client_msisdn: phoneNumber,
        portefeuille: SINGPAY_WALLET_ID,
        isTransfer: false,
      }),
    });

    const data: any = await res.json().catch(() => null);

    if (!res.ok || !data) {
      generateAuditLog({
        action: 'PAYMENT_FAILED',
        userId,
        ipAddress: ip,
        status: 'FAILED',
        details: `Échec de l'initiation du paiement SingPay (HTTP ${res.status}) : ${JSON.stringify(data)}`,
      });

      return {
        success: false,
        status: 'failed',
        message_fr: 'Le paiement a échoué. Veuillez réessayer ou vérifier votre solde Mobile Money.',
        message_en: 'Payment failed. Please try again or check your Mobile Money balance.',
        raw: data,
      };
    }

    // À CONFIRMER : nom exact des champs de la réponse SingPay (non vu dans la doc).
    // Fallback large en attendant le premier test réel.
    const transactionId: string | undefined =
      data.transaction_id || data.id || data.reference || data.transactionId;
    const status: PaymentResult['status'] =
      data.status === 'success' || data.status === 'SUCCESS' ? 'success' : 'pending';

    generateAuditLog({
      action: 'PAYMENT_PENDING_OR_SUCCESS',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Paiement ${operator.toUpperCase()} en statut "${status}" (transactionId: ${transactionId}). RAW: ${JSON.stringify(data)}`,
    });

    return {
      success: true,
      transactionId,
      status,
      message_fr: 'Paiement initié. Validez la demande sur votre téléphone via le code envoyé.',
      message_en: 'Payment initiated. Confirm the request on your phone with the code sent.',
      raw: data,
    };
  } catch (err: any) {
    generateAuditLog({
      action: 'PAYMENT_ERROR',
      userId,
      ipAddress: ip,
      status: 'FAILED',
      details: `Erreur technique lors de l'appel SingPay : ${err.message}`,
    });

    return {
      success: false,
      status: 'failed',
      message_fr: 'Erreur technique lors du paiement. Veuillez réessayer.',
      message_en: 'Technical error during payment. Please try again.',
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Vérifie le statut d'une transaction déjà initiée.
 * Endpoint confirmé via la documentation Swagger officielle SingPay :
 * GET /v1/transaction/api/status/{id}
 */
export async function checkPaymentStatus(transactionId: string, userId: string, ip: string): Promise<PaymentResult> {
  if (!isConfigured()) {
    return {
      success: false,
      status: 'failed',
      message_fr: 'Passerelle de paiement non configurée.',
      message_en: 'Payment gateway not configured.',
    };
  }

  try {
    const res = await fetch(`${SINGPAY_STATUS_URL}/${transactionId}`, {
      method: 'GET',
      headers: {
        'x-client-id': SINGPAY_CLIENT_ID as string,
        'x-client-secret': SINGPAY_CLIENT_SECRET as string,
        'x-wallet': SINGPAY_WALLET_ID as string,
      },
    });

    const data: any = await res.json().catch(() => null);
    const status: PaymentResult['status'] =
      data?.status === 'success' ? 'success' : data?.status === 'failed' ? 'failed' : 'pending';

    generateAuditLog({
      action: 'PAYMENT_STATUS_CHECKED',
      userId,
      ipAddress: ip,
      status: 'SUCCESS',
      details: `Statut vérifié pour transaction ${transactionId} : ${status}.`,
    });

    return {
      success: res.ok,
      transactionId,
      status,
      message_fr: `Statut du paiement : ${status}.`,
      message_en: `Payment status: ${status}.`,
      raw: data,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'failed',
      message_fr: 'Impossible de vérifier le statut du paiement.',
      message_en: 'Unable to check payment status.',
    };
  }
  }
