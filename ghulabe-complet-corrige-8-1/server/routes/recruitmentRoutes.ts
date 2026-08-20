import { Router } from 'express';
import {
  startRecruitmentPayment,
  getRecruitmentPaymentStatus,
  startRecruitmentPawaPayPayment,
  getRecruitmentPawaPayStatus,
  uploadVerificationPhoto,
  getVerificationPhotos,
  notifyTestCompleted,
} from '../controllers/recruitmentController';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Paiement du frais de recrutement développeur — PAS d'auth requise :
// le candidat n'a pas encore de compte à ce stade du parcours.
router.post('/start', apiRateLimiter, startRecruitmentPayment);
router.get('/status/:transactionId', apiRateLimiter, getRecruitmentPaymentStatus);

// Paiement zone CFA élargie (hors Gabon) — complément à /start (SingPay) pour
// les candidats sans Airtel Money / Moov Money Gabon. Pas d'auth non plus.
router.post('/pawapay-start', apiRateLimiter, startRecruitmentPawaPayPayment);
router.get('/pawapay-status/:depositId', apiRateLimiter, getRecruitmentPawaPayStatus);

// Vérification anti-triche RÉELLE (document d'identité + preuve de vie + captures QCM) —
// pas d'auth requise non plus : le candidat n'a pas encore de compte à ce stade.
router.post('/verification-photo', apiRateLimiter, uploadVerificationPhoto);

// Alerte admin temps réel à la fin d'un test QCM (email + WhatsApp)
router.post('/test-completed', apiRateLimiter, notifyTestCompleted);

// Consultation des photos par un admin (pour validation manuelle du candidat)
router.get('/verification-photos/:email', requireAuth, requireAdmin, apiRateLimiter, getVerificationPhotos);

export default router;
