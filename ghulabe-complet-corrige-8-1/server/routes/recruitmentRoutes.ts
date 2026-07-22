import { Router } from 'express';
import { startRecruitmentPayment, getRecruitmentPaymentStatus } from '../controllers/recruitmentController';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Paiement du frais de recrutement développeur — PAS d'auth requise :
// le candidat n'a pas encore de compte à ce stade du parcours.
router.post('/start', apiRateLimiter, startRecruitmentPayment);
router.get('/status/:transactionId', apiRateLimiter, getRecruitmentPaymentStatus);

export default router;
