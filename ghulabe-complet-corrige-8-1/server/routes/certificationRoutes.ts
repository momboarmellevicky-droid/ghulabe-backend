import { Router } from 'express';
import { getPublicCertification, getCertificationBadgeSvg } from '../controllers/certificationController';

const router = Router();

// Public : aucune authentification, c'est le but (vérification par des tiers).
// Rate-limiting déjà appliqué globalement sur /api dans server.ts.
router.get('/:domainId', getPublicCertification);
router.get('/:domainId/badge.svg', getCertificationBadgeSvg);

export default router;
