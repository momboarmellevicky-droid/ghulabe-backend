import { Router } from 'express';
import { startScan, getScanReport, getScanHistory, previewScan } from '../controllers/scanController';
import { scanRateLimiter, apiRateLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Route principale de démarrage de scan (Protégée par scanRateLimiter : 10 scans/heure par IP en mode gratuit)
// Reste accessible sans authentification : scan anonyme autorisé pour le tier gratuit (limité par IP).
router.post('/start', scanRateLimiter, startScan);
router.post('/preview', scanRateLimiter, previewScan);
// Routes de rapports et d'historique — AUTH OBLIGATOIRE : un scan appartient à un utilisateur,
// requireAuth peuple req.user.id qui sert ensuite à vérifier la propriété du scan (anti-IDOR).
router.get('/report/:scanId', requireAuth, apiRateLimiter, getScanReport);
router.get('/history/:domainId', requireAuth, apiRateLimiter, getScanHistory);

export default router;
