import { Router } from 'express';
import {
  startRecruitmentPayment,
  getRecruitmentPaymentStatus,
  uploadVerificationPhoto,
  getVerificationPhotos,
} from '../controllers/recruitmentController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Paiement du frais de recrutement développeur — PAS d'auth requise :
// le candidat n'a pas encore de compte à ce stade du parcours.
router.post('/start', apiRateLimiter, startRecruitmentPayment);
router.get('/status/:transactionId', apiRateLimiter, getRecruitmentPaymentStatus);

// Vérification anti-triche RÉELLE (document d'identité + preuve de vie + captures QCM) —
// pas d'auth requise non plus : le candidat n'a pas encore de compte à ce stade.
router.post('/verification-photo', apiRateLimiter, uploadVerificationPhoto);

// Consultation des photos par un admin (pour validation manuelle du candidat)
router.get('/verification-photos/:email', requireAuth, requireAdmin, apiRateLimiter, getVerificationPhotos);

export default router;
