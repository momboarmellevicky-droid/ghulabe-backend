import { Router } from 'express';
import { startStripeCheckout } from '../controllers/stripeController';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Paiement carte internationale (Stripe Checkout) — AUTH OBLIGATOIRE.
// Le webhook (/api/stripe/webhook) est monté séparément dans server.ts
// AVANT express.json(), car Stripe exige le corps brut (raw) pour vérifier
// la signature de la requête.
router.post('/create-checkout-session', requireAuth, apiRateLimiter, startStripeCheckout);

export default router;
