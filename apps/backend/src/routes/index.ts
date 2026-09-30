import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { studentRoutes } from './student.routes.js';
import { adminRoutes } from './admin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/student', studentRoutes);
router.use('/admin', adminRoutes);

router.get('/health', (_req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'GDQP&AN E-Learning API',
  });
});

export const apiRoutes = router;
