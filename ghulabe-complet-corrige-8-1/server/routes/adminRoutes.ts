import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { getPendingApps } from '../controllers/adminController';

const router = Router();

router.get('/pending-apps', requireAuth, requireAdmin, apiRateLimiter, getPendingApps);

export default router;
