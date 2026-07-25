import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { getPendingApps, updateAppStatus, requestAdminOtp, verifyAdminOtp } from '../controllers/adminController';

const router = Router();

router.get('/pending-apps', requireAuth, requireAdmin, apiRateLimiter, getPendingApps);
router.patch('/pending-apps/:id', requireAuth, requireAdmin, apiRateLimiter, updateAppStatus);
router.post('/request-otp', requireAuth, apiRateLimiter, requestAdminOtp);
router.post('/verify-otp', requireAuth, apiRateLimiter, verifyAdminOtp);

export default router;
