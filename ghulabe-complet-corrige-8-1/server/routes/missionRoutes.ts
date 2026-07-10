import { Router } from 'express';
import { getMissions } from '../controllers/missionController';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Liste des missions, adaptée au rôle de l'utilisateur (client / dev / admin) — voir missionController.ts.
router.get('/', requireAuth, apiRateLimiter, getMissions);

export default router;
