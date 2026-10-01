import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.config.js';
import { connectDatabase } from './config/database.js';
import { getRedisClient } from './config/redis.js';
import { apiRoutes } from './routes/index.js';
import { User, normalizeVietnamese } from './models/User.model.js';
import { Course } from './models/Course.model.js';
import { Lesson } from './models/Lesson.model.js';
import { Question } from './models/Question.model.js';
import { AuthService } from './services/auth.service.js';

const app = express();

// 1. Bảo mật & Middleware cơ bản
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (curl, server-to-server) hoặc các địa chỉ dev localhost
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === ENV.CLIENT_URL) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 2. Giới hạn tần suất gọi API (Rate limiting)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 300, // Tối đa 300 requests/phút mỗi IP
  message: { success: false, message: 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau 1 phút.' },
});
app.use('/api/', apiLimiter);

// 3. Khai báo các Routes
app.use('/api', apiRoutes);

// 4. Seed dữ liệu khởi tạo (Admin mặc định & Bài học mẫu nếu DB rỗng)
async function seedInitialData() {
  try {
    // 4.1. Tạo tài khoản Admin mặc định nếu chưa có
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const defaultPassword = 'Admin@123456';
      const hash = await AuthService.hashPassword(defaultPassword);
      await User.create({
        mssv: 'ADMIN01',
        nameRaw: 'Quản Trị Viên',
        nameNormalized: normalizeVietnamese('Quản Trị Viên'),
        email: 'admin@gdqpan.edu.vn',
        passwordHash: hash,
        role: 'admin',
        isActive: true,
      });
      console.log('✅ Đã khởi tạo tài khoản Admin mặc định:');
      console.log('   Tài khoản: admin@gdqpan.edu.vn hoặc ADMIN01');
      console.log('   Mật khẩu: Admin@123456');
    }

    // 4.2. Tạo Khóa học & Bài học mẫu nếu chưa có
    const courseCount = await Course.countDocuments();
    if (courseCount === 0) {
      const course = await Course.create({
        code: 'GDQP01',
        title: 'Giáo Dục Quốc Phòng & An Ninh (Học Phần 1)',
        description: 'Đường lối quốc phòng và an ninh của Đảng Cộng sản Việt Nam',
        totalLessons: 2,
      });

      const lesson1 = await Lesson.create({
        courseId: course._id,
        title: 'Bài 1: Đối tượng, phương pháp nghiên cứu môn học GDQP&AN',
        order: 1,
        videoDurationSeconds: 600, // 10 phút
        passScore: 8,
        totalQuestionsPerQuiz: 10,
      });

      // Tạo 15 câu hỏi mẫu cho bài 1
      const sampleQuestions = [];
      for (let i = 1; i <= 15; i++) {
        sampleQuestions.push({
          lessonId: lesson1._id,
          courseId: course._id,
          text: `Câu hỏi ôn tập số ${i}: Mục tiêu cơ bản của việc học tập môn GDQP&AN là gì?`,
          choices: [
            { id: 'A', text: 'Bồi dưỡng lòng yêu nước và ý thức trách nhiệm bảo vệ Tổ quốc.' },
            { id: 'B', text: 'Chỉ rèn luyện thể lực đơn thuần.' },
            { id: 'C', text: 'Tham gia các khóa học thực tế tại địa phương.' },
            { id: 'D', text: 'Không yêu cầu kiến thức lý luận.' },
          ],
          correctIds: ['A'],
          explanation: 'Mục tiêu cốt lõi của GDQP&AN là giáo dục lòng yêu nước, niềm tự hào dân tộc và ý thức bảo vệ Tổ quốc Việt Nam XHCN.',
          active: true,
        });
      }
      await Question.insertMany(sampleQuestions);
      console.log('✅ Đã khởi tạo Khóa học, Bài học và 15 câu hỏi mẫu.');
    }
  } catch (err) {
    console.warn('Lỗi khi seed dữ liệu ban đầu:', err);
  }
}

// 5. Khởi động Server
async function startServer() {
  await connectDatabase();
  getRedisClient(); // Khởi tạo kết nối Redis
  await seedInitialData();

  app.listen(ENV.PORT, () => {
    console.log(`🚀 GDQP&AN E-Learning Backend API đang chạy tại: http://localhost:${ENV.PORT}`);
    console.log(`👉 Kiểm tra trạng thái: http://localhost:${ENV.PORT}/api/health`);
  });
}

startServer();
