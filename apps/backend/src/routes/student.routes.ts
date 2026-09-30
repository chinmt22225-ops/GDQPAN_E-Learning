import { Router } from 'express';
import { StudentController } from '../controllers/student.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { videoHeartbeatSchema, quizSubmitSchema } from '@elearning/shared';

const router = Router();

// Tất cả các route học sinh yêu cầu đăng nhập
router.use(requireAuth);

router.get('/courses', StudentController.getCourses);
router.get('/courses/:courseId/lessons', StudentController.getCourseLessons);
router.post('/lessons/:lessonId/heartbeat', validateBody(videoHeartbeatSchema), StudentController.heartbeat);
router.get('/lessons/:lessonId/quiz', StudentController.getQuiz);
router.post('/lessons/:lessonId/quiz/submit', validateBody(quizSubmitSchema), StudentController.submitQuiz);

export const studentRoutes = router;
