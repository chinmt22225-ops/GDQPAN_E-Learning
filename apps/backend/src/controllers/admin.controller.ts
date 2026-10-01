import { Request, Response } from 'express';
import { User } from '../models/User.model.js';
import { LessonProgress } from '../models/LessonProgress.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { QuizAttempt } from '../models/QuizAttempt.model.js';
import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { Question } from '../models/Question.model.js';
import { ExcelService } from '../services/excel.service.js';
import { sseService } from './../services/sse.service.js';
import { StorageService } from '../services/storage.service.js';

export class AdminController {
  static async getDashboardStats(_req: Request, res: Response): Promise<void> {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalPassedStudents = await Enrollment.countDocuments({ allPassed: true });
    const totalQuizAttempts = await LessonProgress.aggregate([
      { $group: { _id: null, totalAttempts: { $sum: '$attemptsCount' } } },
    ]);

    // Thống kê chi tiết tiến độ từng bài học
    const lessons = await Lesson.find({ active: true })
      .sort({ order: 1 })
      .populate('courseId', 'code title')
      .lean();

    const lessonProgressStats = await LessonProgress.aggregate([
      {
        $group: {
          _id: '$lessonId',
          passedCount: { $sum: { $cond: [{ $eq: ['$passed', true] }, 1, 0] } },
          watchingCount: { $sum: { $cond: [{ $eq: ['$status', 'WATCHING'] }, 1, 0] } },
          totalAttempts: { $sum: '$attemptsCount' },
          avgHighestScore: { $avg: '$highestScore' },
        },
      },
    ]);

    const statMap = new Map(lessonProgressStats.map((s) => [s._id.toString(), s]));

    const lessonStats = lessons.map((l) => {
      const s = statMap.get(l._id.toString());
      const passedCount = s?.passedCount || 0;
      const passRate = totalStudents > 0 ? Math.round((passedCount / totalStudents) * 100) : 0;
      const course = l.courseId as unknown as { code?: string; title?: string } | null;

      return {
        lessonId: l._id.toString(),
        title: l.title,
        order: l.order,
        courseCode: course?.code || '',
        courseTitle: course?.title || '',
        passedCount,
        totalAttempts: s?.totalAttempts || 0,
        passRate,
        avgScore: s ? Math.round((s.avgHighestScore || 0) * 10) / 10 : 0,
      };
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        totalPassedStudents,
        passRate: totalStudents > 0 ? Math.round((totalPassedStudents / totalStudents) * 100) : 0,
        totalAttempts: totalQuizAttempts[0]?.totalAttempts || 0,
        lessonStats,
      },
    });
  }

  static async getStudents(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 50)));
    const q = String(req.query.q || '').trim();
    const status = String(req.query.status || '').trim(); // 'passed' | 'pending'

    const filter: Record<string, unknown> = { role: 'student' };

    if (q) {
      filter.$or = [
        { mssv: new RegExp(q, 'i') },
        { nameRaw: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ mssv: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((u) => u._id);
    const enrollments = await Enrollment.find({ userId: { $in: userIds } }).lean();
    const enrollmentMap = new Map(enrollments.map((e) => [e.userId.toString(), e]));

    const rows = users.map((u) => {
      const e = enrollmentMap.get(u._id.toString());
      return {
        _id: u._id,
        mssv: u.mssv,
        name: u.nameRaw,
        class: u.class,
        email: u.email,
        isActive: u.isActive,
        allPassed: e?.allPassed || false,
        completedAt: e?.completedAt,
      };
    });

    // Lọc theo trạng thái nếu có yêu cầu
    const filteredRows = status === 'passed'
      ? rows.filter((r) => r.allPassed)
      : status === 'pending'
      ? rows.filter((r) => !r.allPassed)
      : rows;

    res.json({
      success: true,
      data: filteredRows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  static async importStudents(req: Request, res: Response): Promise<void> {
    // Nhận mảng bytes từ body hoặc file
    if (!req.body || !Buffer.isBuffer(req.body)) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp file Excel hợp lệ.' });
      return;
    }

    try {
      const result = await ExcelService.importStudentsFromBuffer(req.body);
      res.json({
        success: true,
        message: `Đã xử lý xong: Nhập thành công ${result.imported}/${result.total} sinh viên.`,
        data: result,
      });
    } catch (err: unknown) {
      res.status(400).json({ success: false, message: (err as Error).message });
    }
  }

  static async exportStudents(_req: Request, res: Response): Promise<void> {
    try {
      const buffer = await ExcelService.exportResultsToBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Bang_Diem_Elearning_GDQPAN.xlsx"');
      res.send(buffer);
    } catch (err: unknown) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  }

  static sseEvents(req: Request, res: Response): void {
    const clientId = `${req.user?.userId || 'admin'}_${Date.now()}`;
    sseService.addAdminClient(clientId, res);
  }

  /**
   * Xóa vĩnh viễn toàn bộ dữ liệu của một sinh viên
   */
  static async deleteStudent(req: Request, res: Response): Promise<void> {
    const { studentId } = req.params;

    if (!studentId) {
      res.status(400).json({ success: false, message: 'Thiếu ID sinh viên cần xóa.' });
      return;
    }

    const student = await User.findById(studentId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên trong hệ thống.' });
      return;
    }

    if (student.role !== 'student') {
      res.status(403).json({ success: false, message: 'Chỉ được phép xóa tài khoản sinh viên.' });
      return;
    }

    // Xóa TOÀN BỘ dữ liệu liên quan đến sinh viên này:
    // 1. Kết quả thi trắc nghiệm (QuizAttempt)
    // 2. Tiến độ xem video & học tập (LessonProgress)
    // 3. Ghi danh & tiến trình khóa học (Enrollment)
    // 4. Bản ghi tài khoản sinh viên (User)
    await Promise.all([
      QuizAttempt.deleteMany({ userId: student._id }),
      LessonProgress.deleteMany({ userId: student._id }),
      Enrollment.deleteMany({ userId: student._id }),
      User.findByIdAndDelete(student._id),
    ]);

    res.json({
      success: true,
      message: `Đã xóa vĩnh viễn toàn bộ dữ liệu của sinh viên ${student.nameRaw} (MSSV: ${student.mssv}).`,
    });
  }

  // ==========================================
  // KHÓA HỌC (COURSES)
  // ==========================================

  static async getCourses(_req: Request, res: Response): Promise<void> {
    const courses = await Course.find().sort({ createdAt: -1 }).lean();
    const courseIds = courses.map((c) => c._id);
    const lessonCounts = await Lesson.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(lessonCounts.map((l) => [l._id.toString(), l.count]));

    const result = courses.map((c) => ({
      ...c,
      totalLessons: countMap.get(c._id.toString()) || 0,
    }));

    res.json({ success: true, data: result });
  }

  static async createCourse(req: Request, res: Response): Promise<void> {
    const { code, title, description, active } = req.body;
    if (!code || !title) {
      res.status(400).json({ success: false, message: 'Mã học phần và tên học phần là bắt buộc.' });
      return;
    }

    const existing = await Course.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      res.status(400).json({ success: false, message: `Mã học phần ${code.toUpperCase()} đã tồn tại.` });
      return;
    }

    const course = await Course.create({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description?.trim() || '',
      active: active !== undefined ? Boolean(active) : true,
      totalLessons: 0,
    });

    res.status(201).json({ success: true, data: course, message: 'Tạo khóa học thành công.' });
  }

  static async updateCourse(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;
    const { code, title, description, active } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Không tìm thấy khóa học.' });
      return;
    }

    if (code && code.trim().toUpperCase() !== course.code) {
      const existing = await Course.findOne({
        code: code.trim().toUpperCase(),
        _id: { $ne: course._id },
      });
      if (existing) {
        res.status(400).json({ success: false, message: `Mã học phần ${code.toUpperCase()} đã tồn tại ở môn khác.` });
        return;
      }
      course.code = code.trim().toUpperCase();
    }

    if (title) course.title = title.trim();
    if (description !== undefined) course.description = description.trim();
    if (active !== undefined) course.active = Boolean(active);

    await course.save();
    res.json({ success: true, data: course, message: 'Cập nhật khóa học thành công.' });
  }

  static async deleteCourse(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Không tìm thấy khóa học.' });
      return;
    }

    const lessons = await Lesson.find({ courseId: course._id }).select('_id');
    const lessonIds = lessons.map((l) => l._id);

    await Promise.all([
      Question.deleteMany({ lessonId: { $in: lessonIds } }),
      LessonProgress.deleteMany({ lessonId: { $in: lessonIds } }),
      QuizAttempt.deleteMany({ courseId: course._id }),
      Enrollment.deleteMany({ courseId: course._id }),
      Lesson.deleteMany({ courseId: course._id }),
      Course.findByIdAndDelete(course._id),
    ]);

    res.json({
      success: true,
      message: `Đã xóa khóa học ${course.title} và toàn bộ bài học, câu hỏi liên quan.`,
    });
  }

  // ==========================================
  // BÀI HỌC (LESSONS)
  // ==========================================

  static async getLessonsByCourse(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;
    const lessons = await Lesson.find({ courseId }).sort({ order: 1 }).lean();
    const lessonIds = lessons.map((l) => l._id);

    const questionCounts = await Question.aggregate([
      { $match: { lessonId: { $in: lessonIds } } },
      { $group: { _id: '$lessonId', count: { $sum: 1 } } },
    ]);
    const qCountMap = new Map(questionCounts.map((q) => [q._id.toString(), q.count]));

    const result = lessons.map((l) => ({
      ...l,
      questionCount: qCountMap.get(l._id.toString()) || 0,
    }));

    res.json({ success: true, data: result });
  }

  static async createLesson(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Không tìm thấy khóa học.' });
      return;
    }

    const {
      title,
      order,
      videoKey,
      videoDurationSeconds,
      minCoveragePercent,
      passScore,
      totalQuestionsPerQuiz,
      active,
    } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'Tên bài học là bắt buộc.' });
      return;
    }

    let lessonOrder = order !== undefined ? Number(order) : undefined;
    if (!lessonOrder) {
      const lastLesson = await Lesson.findOne({ courseId: course._id }).sort({ order: -1 });
      lessonOrder = lastLesson ? lastLesson.order + 1 : 1;
    }

    const lesson = await Lesson.create({
      courseId: course._id,
      title: title.trim(),
      order: lessonOrder,
      videoKey: videoKey?.trim() || '',
      videoDurationSeconds: Number(videoDurationSeconds || 0),
      minCoveragePercent: minCoveragePercent !== undefined ? Number(minCoveragePercent) : 0.95,
      passScore: passScore !== undefined ? Number(passScore) : 8,
      totalQuestionsPerQuiz: totalQuestionsPerQuiz !== undefined ? Number(totalQuestionsPerQuiz) : 10,
      active: active !== undefined ? Boolean(active) : true,
    });

    const count = await Lesson.countDocuments({ courseId: course._id });
    await Course.findByIdAndUpdate(course._id, { totalLessons: count });

    res.status(201).json({ success: true, data: lesson, message: 'Tạo bài học thành công.' });
  }

  static async updateLesson(req: Request, res: Response): Promise<void> {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bài học.' });
      return;
    }

    const {
      title,
      order,
      videoKey,
      videoDurationSeconds,
      minCoveragePercent,
      passScore,
      totalQuestionsPerQuiz,
      active,
    } = req.body;

    if (title) lesson.title = title.trim();
    if (order !== undefined) lesson.order = Number(order);
    if (videoKey !== undefined) lesson.videoKey = videoKey.trim();
    if (videoDurationSeconds !== undefined) lesson.videoDurationSeconds = Number(videoDurationSeconds);
    if (minCoveragePercent !== undefined) lesson.minCoveragePercent = Number(minCoveragePercent);
    if (passScore !== undefined) lesson.passScore = Number(passScore);
    if (totalQuestionsPerQuiz !== undefined) lesson.totalQuestionsPerQuiz = Number(totalQuestionsPerQuiz);
    if (active !== undefined) lesson.active = Boolean(active);

    await lesson.save();
    res.json({ success: true, data: lesson, message: 'Cập nhật bài học thành công.' });
  }

  static async deleteLesson(req: Request, res: Response): Promise<void> {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bài học.' });
      return;
    }

    const courseId = lesson.courseId;

    await Promise.all([
      Question.deleteMany({ lessonId: lesson._id }),
      LessonProgress.deleteMany({ lessonId: lesson._id }),
      QuizAttempt.deleteMany({ lessonId: lesson._id }),
      Lesson.findByIdAndDelete(lesson._id),
    ]);

    const count = await Lesson.countDocuments({ courseId });
    await Course.findByIdAndUpdate(courseId, { totalLessons: count });

    res.json({
      success: true,
      message: `Đã xóa bài học ${lesson.title} và toàn bộ câu hỏi liên quan.`,
    });
  }

  static async uploadLessonVideo(req: Request, res: Response): Promise<void> {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bài học.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Vui lòng đính kèm file video hợp lệ.' });
      return;
    }

    // Xóa video cũ nếu có và là file local
    if (lesson.videoKey) {
      StorageService.deleteLocalVideo(lesson.videoKey);
    }

    lesson.videoKey = req.file.filename;

    // Nếu admin gửi kèm thời lượng video (phút)
    if (req.body.videoDurationMinutes) {
      lesson.videoDurationSeconds = Math.max(1, Number(req.body.videoDurationMinutes) * 60);
    }

    await lesson.save();

    res.json({
      success: true,
      message: 'Tải lên video bài giảng thành công.',
      data: {
        videoKey: lesson.videoKey,
        videoDurationSeconds: lesson.videoDurationSeconds,
      },
    });
  }

  // ==========================================
  // NGÂN HÀNG CÂU HỎI (QUESTIONS)
  // ==========================================

  static async getQuestionsByLesson(req: Request, res: Response): Promise<void> {
    const { lessonId } = req.params;
    const questions = await Question.find({ lessonId }).sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: questions });
  }

  static async createQuestion(req: Request, res: Response): Promise<void> {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bài học.' });
      return;
    }

    const { text, choices, correctIds, explanation, active } = req.body;
    if (!text || !choices || !correctIds || choices.length < 2 || correctIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp nội dung câu hỏi, tối thiểu 2 đáp án lựa chọn và chọn ít nhất 1 đáp án đúng.',
      });
      return;
    }

    const question = await Question.create({
      lessonId: lesson._id,
      courseId: lesson.courseId,
      text: text.trim(),
      choices,
      correctIds,
      explanation: explanation?.trim() || '',
      active: active !== undefined ? Boolean(active) : true,
    });

    res.status(201).json({ success: true, data: question, message: 'Tạo câu hỏi thành công.' });
  }

  static async updateQuestion(req: Request, res: Response): Promise<void> {
    const { questionId } = req.params;
    const question = await Question.findById(questionId);
    if (!question) {
      res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' });
      return;
    }

    const { text, choices, correctIds, explanation, active } = req.body;

    if (text) question.text = text.trim();
    if (choices) question.choices = choices;
    if (correctIds) question.correctIds = correctIds;
    if (explanation !== undefined) question.explanation = explanation.trim();
    if (active !== undefined) question.active = Boolean(active);

    await question.save();
    res.json({ success: true, data: question, message: 'Cập nhật câu hỏi thành công.' });
  }

  static async deleteQuestion(req: Request, res: Response): Promise<void> {
    const { questionId } = req.params;
    const question = await Question.findByIdAndDelete(questionId);
    if (!question) {
      res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' });
      return;
    }
    res.json({ success: true, message: 'Đã xóa câu hỏi khỏi ngân hàng đề.' });
  }

  static async importQuestions(req: Request, res: Response): Promise<void> {
    const { lessonId } = req.params;
    if (!req.body || !Buffer.isBuffer(req.body)) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp file Excel hợp lệ.' });
      return;
    }

    try {
      const result = await ExcelService.importQuestionsFromBuffer(lessonId, req.body);
      res.json({
        success: true,
        message: `Đã nạp thành công ${result.imported}/${result.total} câu hỏi vào ngân hàng đề.`,
        data: result,
      });
    } catch (err: unknown) {
      res.status(400).json({ success: false, message: (err as Error).message });
    }
  }

  static async exportQuestions(req: Request, res: Response): Promise<void> {
    const { lessonId } = req.params;
    try {
      const buffer = await ExcelService.exportQuestionsToBuffer(lessonId);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Ngan_Hang_Cau_Hoi_Bai_${lessonId}.xlsx"`
      );
      res.send(buffer);
    } catch (err: unknown) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  }

  static async getQuestionTemplate(_req: Request, res: Response): Promise<void> {
    try {
      const buffer = await ExcelService.generateQuestionTemplateBuffer();
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="Mau_Nap_Cau_Hoi_GDQPAN.xlsx"'
      );
      res.send(buffer);
    } catch (err: unknown) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  }
}
