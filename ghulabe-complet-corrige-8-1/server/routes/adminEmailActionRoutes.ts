import { Router } from 'express';
import { certifyDeveloperViaEmail, rejectDeveloperViaEmail } from '../controllers/adminEmailActionController';

const router = Router();

// Routes PUBLIQUES volontairement (pas de requireAuth) : cliquées depuis un
// email, donc aucun jeton JWT de session n'est disponible. La sécurité repose
// sur le jeton aléatoire à usage unique dans l'URL (voir adminEmailActionController.ts),
// pas sur l'authentification classique.
router.get('/certify-developer', certifyDeveloperViaEmail);
router.get('/reject-developer', rejectDeveloperViaEmail);

export default router;
