import { Router } from 'express';
import { getDashboardData } from '../controllers/dashboardController';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, apiRateLimiter, getDashboardData);

export default router;
