import { Router } from 'express';
import { runWeeklyMonitoring } from '../controllers/monitoringController';

const router = Router();

// Protégé par le header x-cron-secret (vérifié dans le contrôleur), pas par requireAuth :
// c'est un déclencheur externe (cron-job.org), pas un utilisateur connecté.
router.post('/weekly-scan', runWeeklyMonitoring);

export default router;
