import { Router } from 'express';
import { getMissions } from '../controllers/missionController';
import { getMatchingDevelopers } from '../controllers/matchingController';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Liste des missions, adaptée au rôle de l'utilisateur (client / dev / admin) — voir missionController.ts.
router.get('/', requireAuth, apiRateLimiter, getMissions);

// Développeurs qualifiés pour une mission, matchés selon sa catégorie (WordPress/Serveur/SSL) — voir matchingController.ts.
router.get('/:id/matching-developers', requireAuth, apiRateLimiter, getMatchingDevelopers);

export default router;
