import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  loginSchema,
  activateAccountSchema,
  registerStudentSchema,
  googleAuthSchema,
} from '@elearning/shared';

const router = Router();

// Lấy mã Captcha bảo vệ
router.get('/captcha', AuthController.getCaptcha);

// Đăng ký học viên trực tiếp qua biểu mẫu
router.post('/register', validateBody(registerStudentSchema), AuthController.register);

// Đăng ký / Đăng nhập qua Google (bắt buộc nhập MSSV & Họ tên)
router.post('/google', validateBody(googleAuthSchema), AuthController.googleAuth);

// Đăng nhập tiêu chuẩn
router.post('/login', validateBody(loginSchema), AuthController.login);

// Kích hoạt tài khoản lần đầu qua email
router.post('/activate', validateBody(activateAccountSchema), AuthController.activate);

// Kiểm tra phiên đăng nhập hiện tại
router.get('/me', requireAuth, AuthController.me);

// Đăng xuất
router.post('/logout', AuthController.logout);

export const authRoutes = router;
