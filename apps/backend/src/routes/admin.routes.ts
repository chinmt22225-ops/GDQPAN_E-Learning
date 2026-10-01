import { Router } from 'express';
import express from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { ContestController } from '../controllers/contest.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { videoUploadMiddleware } from '../services/storage.service.js';

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

// Quản lý Khóa học (Courses)
router.get('/courses', AdminController.getCourses);
router.post('/courses', AdminController.createCourse);
router.put('/courses/:courseId', AdminController.updateCourse);
router.delete('/courses/:courseId', AdminController.deleteCourse);

// Quản lý Bài học (Lessons)
router.get('/courses/:courseId/lessons', AdminController.getLessonsByCourse);
router.post('/courses/:courseId/lessons', AdminController.createLesson);
router.put('/lessons/:lessonId', AdminController.updateLesson);
router.delete('/lessons/:lessonId', AdminController.deleteLesson);
router.post('/lessons/:lessonId/video', videoUploadMiddleware.single('video'), AdminController.uploadLessonVideo);

// Quản lý Ngân hàng Câu hỏi (Questions)
router.get('/questions/template.xlsx', AdminController.getQuestionTemplate);
router.get('/lessons/:lessonId/questions', AdminController.getQuestionsByLesson);
router.get('/lessons/:lessonId/questions/export.xlsx', AdminController.exportQuestions);
router.post(
  '/lessons/:lessonId/questions/import',
  express.raw({ type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'], limit: '10mb' }),
  AdminController.importQuestions
);
router.post('/lessons/:lessonId/questions', AdminController.createQuestion);
router.put('/questions/:questionId', AdminController.updateQuestion);
router.delete('/questions/:questionId', AdminController.deleteQuestion);

// Hội thi Chấm Điểm Video Trực Tuyến (Contest Judging)
router.get('/contest/submissions', ContestController.getSubmissions);
router.get('/contest/submissions/:id', ContestController.getSubmissionById);
router.get('/contest/submissions/:id/video', ContestController.streamSubmissionVideo);
router.put('/contest/submissions/:id/score', ContestController.updateJudgeScore);
router.get('/contest/export-excel', ContestController.exportScoresExcel);

export const adminRoutes = router;
