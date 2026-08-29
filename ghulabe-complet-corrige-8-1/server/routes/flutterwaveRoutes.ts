import { Router } from 'express';
import { startFlutterwaveCheckout, verifyFlutterwaveTransaction, flutterwaveWebhook } from '../controllers/flutterwaveController';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Paiement carte internationale (Flutterwave Standard Checkout) — AUTH OBLIGATOIRE.
router.post('/create-checkout-session', requireAuth, apiRateLimiter, startFlutterwaveCheckout);
router.get('/verify/:transactionId', requireAuth, apiRateLimiter, verifyFlutterwaveTransaction);

// Webhook Flutterwave — appelé par Flutterwave lui-même, pas par le frontend.
// Vérifié via l'en-tête verif-hash (voir flutterwaveController.ts), pas par
// requireAuth (Flutterwave n'a pas de JWT GHULABE).
router.post('/webhook', flutterwaveWebhook);

export default router;
