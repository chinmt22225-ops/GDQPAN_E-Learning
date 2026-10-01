import path from 'path';
import fs from 'fs';
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
import { Enrollment } from './models/Enrollment.model.js';
import { AuthService } from './services/auth.service.js';

const app = express();

// 1. Bảo mật & Middleware cơ bản
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

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

// 3. Khai báo các Routes API
app.use('/api', apiRoutes);

// 4. Phục vụ tĩnh thư mục uploads (nếu cần phát video/ảnh trực tiếp)
const uploadDirCandidates = [
  path.resolve(process.cwd(), 'apps', 'backend', 'uploads'),
  path.resolve(process.cwd(), 'uploads'),
  path.resolve(__dirname, '../../uploads'),
  path.resolve(__dirname, '../uploads'),
];

for (const uPath of uploadDirCandidates) {
  if (fs.existsSync(uPath)) {
    app.use('/uploads', express.static(uPath));
    break;
  }
}

// 5. Gộp Frontend vào Backend (Phục vụ SPA Single Page Application)
const frontendDistCandidates = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(process.cwd(), 'apps', 'frontend', 'dist'),
  path.resolve(process.cwd(), 'frontend', 'dist'),
  path.resolve(process.cwd(), 'dist', 'public'),
  path.resolve(__dirname, '../public'),
];

let frontendDistPath: string | null = null;
for (const candidate of frontendDistCandidates) {
  if (fs.existsSync(path.join(candidate, 'index.html'))) {
    frontendDistPath = candidate;
    break;
  }
}

if (frontendDistPath) {
  app.use(express.static(frontendDistPath));

  // SPA Fallback: Chuyển hướng mọi route không phải /api về index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath!, 'index.html'));
  });
} else {
  console.log('ℹ️ Chưa phát hiện thư mục build Frontend (apps/frontend/dist). Chạy ở chế độ API độc lập.');
}

// 6. Seed dữ liệu khởi tạo (Admin mặc định, Sinh viên mẫu & Bài học mẫu nếu DB rỗng)
async function seedInitialData() {
  try {
    // 6.1. Tạo tài khoản Admin mặc định nếu chưa có
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
      console.log('✅ Đã khởi tạo tài khoản Admin mặc định: ADMIN01 / Admin@123456');
    }

    // 6.2. Tạo tài khoản Sinh viên mẫu để demo nếu chưa có
    let demoStudent = await User.findOne({ mssv: 'SV2026001' });
    if (!demoStudent) {
      const studentPassword = 'Sinhvien@123';
      const studentHash = await AuthService.hashPassword(studentPassword);
      demoStudent = await User.create({
        mssv: 'SV2026001',
        nameRaw: 'Nguyễn Văn An',
        nameNormalized: normalizeVietnamese('Nguyễn Văn An'),
        email: 'sinhvien@gdqpan.edu.vn',
        phone: '0987654321',
        school: 'Trường Đại học Bách Khoa',
        class: 'QP01-K26',
        passwordHash: studentHash,
        role: 'student',
        isActive: true,
      });
      console.log('✅ Đã khởi tạo tài khoản Sinh viên mẫu: SV2026001 / Sinhvien@123');
    }

    // 6.3. Đảm bảo sinh viên mẫu được ghi danh vào tất cả khóa học đang mở
    const activeCourses = await Course.find({ active: true });
    for (const c of activeCourses) {
      const enrolled = await Enrollment.findOne({ userId: demoStudent._id, courseId: c._id });
      if (!enrolled) {
        await Enrollment.create({
          userId: demoStudent._id,
          courseId: c._id,
          completedLessons: [],
          allPassed: false,
        });
      }
    }

    // 6.4. Tạo Khóa học & Bài học mẫu nếu chưa có
    const courseCount = await Course.countDocuments();
    if (courseCount === 0) {
      const course = await Course.create({
        code: 'GDQP01',
        title: 'Giáo Dục Quốc Phòng & An Ninh (Học Phần 1)',
        description: 'Đường lối quốc phòng và an ninh của Đảng Cộng sản Việt Nam',
        totalLessons: 2,
        active: true,
      });

      const lesson1 = await Lesson.create({
        courseId: course._id,
        title: 'Bài 1: Đối tượng, phương pháp nghiên cứu môn học GDQP&AN',
        order: 1,
        videoDurationSeconds: 600, // 10 phút
        passScore: 8,
        totalQuestionsPerQuiz: 10,
        active: true,
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

// 7. Khởi động Server Gộp Fullstack
async function startServer() {
  await connectDatabase();
  getRedisClient(); // Khởi tạo kết nối Redis
  await seedInitialData();

  app.listen(ENV.PORT, () => {
    console.log('\n' + '='.repeat(68));
    console.log('🎓 HỆ THỐNG E-LEARNING GDQP&AN - PHIÊN BẢN GỘP FULLSTACK (DEMO)');
    console.log('='.repeat(68));
    console.log(`🌐 TRUY CẬP ỨNG DỤNG TẠI: http://localhost:${ENV.PORT}`);
    console.log(`👉 API Health Check:     http://localhost:${ENV.PORT}/api/health`);
    if (frontendDistPath) {
      console.log(`📦 Tích hợp Frontend:    ĐÃ KÍCH HOẠT (phục vụ từ ${frontendDistPath})`);
    } else {
      console.log(`📦 Tích hợp Frontend:    Chưa build frontend (chạy npm run build trước)`);
    }
    console.log('-'.repeat(68));
    console.log('🔑 TÀI KHOẢN QUẢN TRỊ VIÊN (ADMIN DEMO):');
    console.log('   • Tên đăng nhập: ADMIN01  (hoặc admin@gdqpan.edu.vn)');
    console.log('   • Mật khẩu:      Admin@123456');
    console.log('🔑 TÀI KHOẢN SINH VIÊN (STUDENT DEMO):');
    console.log('   • Tên đăng nhập: SV2026001 (hoặc sinhvien@gdqpan.edu.vn)');
    console.log('   • Mật khẩu:      Sinhvien@123');
    console.log('='.repeat(68) + '\n');
  });
}

startServer();
