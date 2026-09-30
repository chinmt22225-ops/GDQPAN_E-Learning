import { Request, Response } from 'express';
import { User } from '../models/User.model.js';
import { LessonProgress } from '../models/LessonProgress.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { QuizAttempt } from '../models/QuizAttempt.model.js';
import { ExcelService } from '../services/excel.service.js';
import { sseService } from './../services/sse.service.js';

export class AdminController {
  static async getDashboardStats(_req: Request, res: Response): Promise<void> {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalPassedStudents = await Enrollment.countDocuments({ allPassed: true });
    const totalQuizAttempts = await LessonProgress.aggregate([
      { $group: { _id: null, totalAttempts: { $sum: '$attemptsCount' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        totalPassedStudents,
        passRate: totalStudents > 0 ? Math.round((totalPassedStudents / totalStudents) * 100) : 0,
        totalAttempts: totalQuizAttempts[0]?.totalAttempts || 0,
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
}
