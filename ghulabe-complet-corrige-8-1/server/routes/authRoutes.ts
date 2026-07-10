import { Router } from 'express';
import { register, login, verify2FA, logout } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Toutes les routes d'authentification sont protégées par le Rate Limiter strict (100 req/min/IP)
router.post('/register', apiRateLimiter, register);
router.post('/login', apiRateLimiter, login);
router.post('/verify-2fa', apiRateLimiter, verify2FA);
router.post('/logout', requireAuth, logout);

export default router;
