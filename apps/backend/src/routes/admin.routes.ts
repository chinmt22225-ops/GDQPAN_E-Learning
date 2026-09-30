import { Router } from 'express';
import express from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Tất cả route yêu cầu quyền admin
router.use(requireAdmin);

router.get('/dashboard', AdminController.getDashboardStats);
router.get('/students', AdminController.getStudents);
router.delete('/students/:studentId', AdminController.deleteStudent);
router.get('/export.xlsx', AdminController.exportStudents);
router.get('/events', AdminController.sseEvents);

// Hỗ trợ nhận binary raw body cho import excel
router.post(
  '/students/import',
  express.raw({ type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'], limit: '10mb' }),
  AdminController.importStudents
);

export const adminRoutes = router;
