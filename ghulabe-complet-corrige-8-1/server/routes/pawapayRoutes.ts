import { Router } from 'express';
import { handlePawaPayCallback, startPawaPayPayment, getPawaPayPaymentStatus } from '../controllers/pawapayController';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Callback PUBLIC — appelé directement par PawaPay, aucune auth GHULABE possible ici.
router.post('/callback', handlePawaPayCallback);

// Paiement — AUTH OBLIGATOIRE, même logique que /api/payment (SingPay).
router.post('/start', requireAuth, apiRateLimiter, startPawaPayPayment);
router.get('/status/:depositId', requireAuth, apiRateLimiter, getPawaPayPaymentStatus);

export default router;
