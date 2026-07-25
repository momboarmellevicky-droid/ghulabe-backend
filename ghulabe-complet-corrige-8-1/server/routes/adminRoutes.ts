import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { getPendingApps, updateAppStatus, requestAdminOtp, verifyAdminOtp, getDevList, toggleSuspendDev } from '../controllers/adminController';

const router = Router();

router.get('/pending-apps', requireAuth, requireAdmin, apiRateLimiter, getPendingApps);
router.patch('/pending-apps/:id', requireAuth, requireAdmin, apiRateLimiter, updateAppStatus);
router.post('/request-otp', requireAuth, apiRateLimiter, requestAdminOtp);
router.post('/verify-otp', requireAuth, apiRateLimiter, verifyAdminOtp);
router.get('/dev-list', requireAuth, requireAdmin, apiRateLimiter, getDevList);
router.patch('/dev-list/:id/suspend', requireAuth, requireAdmin, apiRateLimiter, toggleSuspendDev);

export default router;
