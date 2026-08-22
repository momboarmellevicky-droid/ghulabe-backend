import { Router } from 'express';
import { runWeeklyMonitoring, runQuickHeartbeatCron } from '../controllers/monitoringController';

const router = Router();

// Protégé par le header x-cron-secret (vérifié dans le contrôleur), pas par requireAuth :
// ce sont des déclencheurs externes (cron-job.org), pas des utilisateurs connectés.
router.post('/weekly-scan', runWeeklyMonitoring);
router.post('/quick-heartbeat', runQuickHeartbeatCron);

export default router;
