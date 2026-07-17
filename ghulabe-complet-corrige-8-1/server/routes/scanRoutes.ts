import { Router } from 'express';
import { startScan, getScanReport, getScanHistory, previewScan } from '../controllers/scanController';
import { scanRateLimiter, apiRateLimiter } from '../middleware/rateLimiter';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware';

const router = Router();

// Route principale de démarrage de scan (Protégée par scanRateLimiter : 10 scans/heure par IP en mode gratuit)
// Reste accessible sans authentification : scan anonyme autorisé pour le tier gratuit (limité par IP).
// optionalAuth peuple req.user si un Bearer token valide est fourni (utilisateur connecté),
// sans jamais bloquer la requête si absent — nécessaire pour que scanController génère et
// persiste le rapport PDF signé quand l'appelant est identifié (bug corrigé le 17/07/2026 :
// req.user restait toujours undefined sur cette route, le PDF n'était donc jamais généré).
router.post('/start', scanRateLimiter, optionalAuth, startScan);
router.post('/preview', scanRateLimiter, previewScan);
// Routes de rapports et d'historique — AUTH OBLIGATOIRE : un scan appartient à un utilisateur,
// requireAuth peuple req.user.id qui sert ensuite à vérifier la propriété du scan (anti-IDOR).
router.get('/report/:scanId', requireAuth, apiRateLimiter, getScanReport);
router.get('/history/:domainId', requireAuth, apiRateLimiter, getScanHistory);

export default router;
