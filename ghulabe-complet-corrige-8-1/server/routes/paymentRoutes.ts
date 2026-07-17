import { Router } from 'express';
import { startPayment, getPaymentStatus } from '../controllers/paymentController';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Paiement Mobile Money — AUTH OBLIGATOIRE : un paiement appartient à un utilisateur identifié.
router.post('/start', requireAuth, apiRateLimiter, startPayment);
router.get('/status/:transactionId', requireAuth, apiRateLimiter, getPaymentStatus);

export default router;
