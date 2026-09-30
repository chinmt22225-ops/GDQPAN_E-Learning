import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { loginSchema, activateAccountSchema } from '@elearning/shared';

const router = Router();

router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/activate', validateBody(activateAccountSchema), AuthController.activate);
router.get('/me', requireAuth, AuthController.me);
router.post('/logout', AuthController.logout);

export const authRoutes = router;
