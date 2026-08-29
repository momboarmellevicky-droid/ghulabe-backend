import Stripe from 'stripe';
import { generateAuditLog } from '../utils/crypto';

// ============================================================================
// GHULABE — PASSERELLE DE PAIEMENT STRIPE (Cartes bancaires internationales)
//
// Complète les canaux Mobile Money existants (SingPay Gabon, PawaPay zone CFA)
// pour les clients hors Afrique francophone qui paient par carte Visa/Mastercard
// (Nigeria, UK, Canada, USA, etc.). Utilise Stripe Checkout (page hébergée
// Stripe) : aucune donnée de carte bancaire ne transite jamais par nos serveurs.
// ============================================================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ghulabe.com';

// Tarifs alignés sur PLAN_INFO côté frontend (PaymentModal.tsx), convertis en USD
// pour un paiement carte international (FCFA n'est pas une devise Stripe standard).
export const STRIPE_PLAN_PRICES_USD: Record<'gardien' | 'pentest_premium', number> = {
  gardien: 9, // ≈ 5000 FCFA
  pentest_premium: 42, // ≈ 25000 FCFA
};

function isConfigured(): boolean {
  return Boolean(STRIPE_SECRET_KEY);
}

function getClient(): Stripe {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY absent de .env — passerelle carte internationale non configurée.');
  }
  return new Stripe(STRIPE_SECRET_KEY);
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
 * Crée une session Stripe Checkout (page de paiement hébergée par Stripe).
 * Le client est redirigé vers cette URL, saisit sa carte sur Stripe, puis
 * revient sur GHULABE. Aucune donnée de carte ne transite par notre backend.
 */
export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
  const { plan, userId, userEmail, lang } = params;

  if (!isConfigured()) {
    generateAuditLog({
      action: 'STRIPE_CHECKOUT_SKIPPED_NOT_CONFIGURED',
      userId,
      ipAddress: 'n/a',
      status: 'BLOCKED',
      details: 'STRIPE_SECRET_KEY absent de .env. Session Checkout non créée.',
    });
    return {
      success: false,
      message_fr: 'Paiement par carte non configuré. Contactez l\'administrateur.',
      message_en: 'Card payment not configured. Contact the administrator.',
    };
  }

  const planLabel = plan === 'gardien' ? 'GHULABE GARDIEN' : 'GHULABE PENTEST PREMIUM';
  const amountUsd = STRIPE_PLAN_PRICES_USD[plan];

  try {
    const stripe = getClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amountUsd * 100,
            product_data: {
              name: planLabel,
              description:
                lang === 'fr'
                  ? 'Abonnement GHULABE — cybersécurité pour PME africaines'
                  : 'GHULABE subscription — cybersecurity for African SMEs',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        plan,
      },
      success_url: `${FRONTEND_URL}/?stripe_success=1&plan=${plan}`,
      cancel_url: `${FRONTEND_URL}/?stripe_canceled=1`,
    });

    generateAuditLog({
      action: 'STRIPE_CHECKOUT_CREATED',
      userId,
      ipAddress: 'n/a',
      status: 'SUCCESS',
      details: `Session Stripe Checkout créée pour le plan ${plan} (${amountUsd} USD).`,
    });

    return {
      success: true,
      url: session.url || undefined,
      message_fr: 'Redirection vers le paiement sécurisé Stripe...',
      message_en: 'Redirecting to secure Stripe payment...',
    };
  } catch (err: any) {
    generateAuditLog({
      action: 'STRIPE_CHECKOUT_ERROR',
      userId,
      ipAddress: 'n/a',
      status: 'FAILED',
      details: `Erreur lors de la création de la session Stripe : ${err.message}`,
    });
    return {
      success: false,
      message_fr: 'Erreur lors de la création du paiement. Veuillez réessayer.',
      message_en: 'Error creating the payment. Please try again.',
    };
  }
}

/**
 * Vérifie la signature d'un événement webhook Stripe et le retourne décodé.
 * Lève une erreur si la signature est invalide (protection contre les faux
 * appels usurpant Stripe).
 */
export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET absent de .env — vérification de signature impossible.');
  }
  const stripe = getClient();
  return stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
}
