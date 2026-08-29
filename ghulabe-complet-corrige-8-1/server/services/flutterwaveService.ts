import { generateAuditLog } from '../utils/crypto';
import { sendAdminRecruitmentAlertEmail } from './emailService';

// ============================================================================
// GHULABE — PASSERELLE DE PAIEMENT FLUTTERWAVE (Cartes bancaires internationales)
//
// Complète les canaux Mobile Money existants (SingPay Gabon, PawaPay zone CFA)
// pour les clients hors zone Mobile Money africaine qui paient par carte
// Visa/Mastercard (Nigeria, UK, Canada, USA, etc.).
//
// Choisi à la place de Stripe : Stripe n'accepte pas les entreprises basées
// au Gabon (liste restreinte de ~46 pays). Flutterwave accepte le Gabon comme
// pays d'enregistrement de l'entreprise ET les cartes internationales via son
// flux "Standard Checkout" (page de paiement hébergée, aucune donnée de carte
// ne transite par nos serveurs). Documentation officielle :
// https://developer.flutterwave.com/v3.0/docs/flutterwave-standard-1
// ============================================================================

const FLW_BASE_URL = 'https://api.flutterwave.com/v3';
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ghulabe.com';

// Tarifs alignés sur PLAN_INFO côté frontend (PaymentModal.tsx), convertis en USD
// pour un paiement carte international (FCFA n'est pas retenu ici : le client
// international paie en USD, devise supportée nativement par Flutterwave).
export const FLW_PLAN_PRICES_USD: Record<'gardien' | 'pentest_premium', number> = {
  gardien: 9, // ≈ 5000 FCFA
  pentest_premium: 42, // ≈ 25000 FCFA
};

function isConfigured(): boolean {
  return Boolean(FLW_SECRET_KEY);
}

export interface CreateCheckoutParams {
  plan: 'gardien' | 'pentest_premium';
  userId: string;
  userEmail: string;
  lang: 'fr' | 'en';
}

export interface CheckoutResult {
  success: boolean;
  url?: string;
  message_fr: string;
  message_en: string;
}

/**
 * Crée une session de paiement Flutterwave Standard Checkout (page hébergée).
 * Le client est redirigé vers cette URL, saisit sa carte sur Flutterwave, puis
 * revient sur GHULABE avec le résultat en paramètres d'URL (jamais utilisé
 * seul pour confirmer un paiement — voir verifyTransaction ci-dessous).
 */
export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
  const { plan, userId, userEmail, lang } = params;

  if (!isConfigured()) {
    generateAuditLog({
      action: 'FLW_CHECKOUT_SKIPPED_NOT_CONFIGURED',
      userId,
      ipAddress: 'n/a',
      status: 'BLOCKED',
      details: 'FLW_SECRET_KEY absent de .env. Session Checkout non créée.',
    });

    // Mesure de la demande réelle pendant que le compte Flutterwave est en
    // cours de configuration (versement bancaire) : chaque tentative de
    // paiement carte est notifiée à l'admin par email, même si le paiement
    // n'aboutit pas techniquement. Le message affiché au client reste
    // discret (pas d'erreur alarmante) pour ne pas donner une mauvaise image.
    await sendAdminRecruitmentAlertEmail(
      '💳 Tentative de paiement carte internationale (compte en cours de configuration)',
      userEmail,
      `Plan demandé : ${plan.toUpperCase()} | Ce client a tenté de payer par carte internationale — le canal n'est pas encore actif (compte de versement en cours d'ouverture).`,
      userId,
      'n/a'
    );

    return {
      success: false,
      message_fr: 'Le paiement par carte sera bientôt disponible. Merci de réessayer prochainement, ou contactez-nous.',
      message_en: 'Card payment will be available soon. Please try again shortly, or contact us.',
    };
  }

  const planLabel = plan === 'gardien' ? 'GHULABE GARDIEN' : 'GHULABE PENTEST PREMIUM';
  const amountUsd = FLW_PLAN_PRICES_USD[plan];
  // Référence unique encodant le plan et l'utilisateur, relue lors de la
  // vérification (webhook ET redirection) pour savoir quel plan attribuer —
  // même principe que reference dans paymentService.ts (SingPay).
  const txRef = `plan-${plan}-${userId}-${Date.now()}`;

  try {
    const res = await fetch(`${FLW_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: amountUsd,
        currency: 'USD',
        redirect_url: `${FRONTEND_URL}/`,
        customer: { email: userEmail },
        customizations: {
          title: planLabel,
          description:
            lang === 'fr'
              ? 'Abonnement GHULABE — cybersécurité pour PME africaines'
              : 'GHULABE subscription — cybersecurity for African SMEs',
        },
      }),
    });

    const data: any = await res.json().catch(() => null);

    if (!res.ok || !data || data.status !== 'success' || !data.data?.link) {
      generateAuditLog({
        action: 'FLW_CHECKOUT_ERROR',
        userId,
        ipAddress: 'n/a',
        status: 'FAILED',
        details: `Échec de la création du paiement Flutterwave (HTTP ${res.status}) : ${JSON.stringify(data)}`,
      });
      return {
        success: false,
        message_fr: 'Erreur lors de la création du paiement. Veuillez réessayer.',
        message_en: 'Error creating the payment. Please try again.',
      };
    }

    generateAuditLog({
      action: 'FLW_CHECKOUT_CREATED',
      userId,
      ipAddress: 'n/a',
      status: 'SUCCESS',
      details: `Session Flutterwave Checkout créée pour le plan ${plan} (${amountUsd} USD, tx_ref: ${txRef}).`,
    });

    return {
      success: true,
      url: data.data.link,
      message_fr: 'Redirection vers le paiement sécurisé...',
      message_en: 'Redirecting to secure payment...',
    };
  } catch (err: any) {
    generateAuditLog({
      action: 'FLW_CHECKOUT_ERROR',
      userId,
      ipAddress: 'n/a',
      status: 'FAILED',
      details: `Erreur technique lors de l'appel Flutterwave : ${err.message}`,
    });
    return {
      success: false,
      message_fr: 'Erreur technique lors du paiement. Veuillez réessayer.',
      message_en: 'Technical error during payment. Please try again.',
    };
  }
}

export interface VerifiedTransaction {
  verified: boolean;
  status: string;
  txRef: string;
  amount: number;
  currency: string;
}

/**
 * Revérifie une transaction directement auprès de Flutterwave (jamais on ne
 * fait confiance à l'URL de redirection ni au corps du webhook seuls — les
 * deux ne servent qu'à déclencher CETTE vérification côté serveur).
 * https://developer.flutterwave.com/v3.0/docs/verify-transaction
 */
export async function verifyTransaction(transactionId: string): Promise<VerifiedTransaction | null> {
  if (!isConfigured()) return null;

  try {
    const res = await fetch(`${FLW_BASE_URL}/transactions/${transactionId}/verify`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
    });
    const data: any = await res.json().catch(() => null);

    if (!res.ok || !data || data.status !== 'success' || !data.data) {
      return null;
    }

    return {
      verified: data.data.status === 'successful',
      status: data.data.status,
      txRef: data.data.tx_ref,
      amount: data.data.amount,
      currency: data.data.currency,
    };
  } catch {
    return null;
  }
}

/**
 * Vérifie l'en-tête verif-hash d'un webhook Flutterwave par comparaison
 * directe avec le secret hash configuré côté dashboard Flutterwave (méthode
 * officielle documentée pour l'API v3 — comparaison simple, pas de HMAC).
 * https://developer.flutterwave.com/docs/webhooks
 */
export function isValidWebhookSignature(headerValue: string | undefined): boolean {
  if (!FLW_SECRET_HASH || !headerValue) return false;
  return headerValue === FLW_SECRET_HASH;
}
