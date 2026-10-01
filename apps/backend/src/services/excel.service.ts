import ExcelJS from 'exceljs';
import { User, normalizeVietnamese } from '../models/User.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { LessonProgress } from '../models/LessonProgress.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { Question } from '../models/Question.model.js';
import { AuthService } from './auth.service.js';
import { emailService } from './email.service.js';

export class ExcelService {
  static async importStudentsFromBuffer(buffer: Buffer): Promise<{
    total: number;
    imported: number;
    errors: { row: number; reason: string }[];
  }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('File Excel không có dữ liệu bảng tính.');
    }

    let total = 0;
    let imported = 0;
    const errors: { row: number; reason: string }[] = [];

    // Hàng 1 thường là tiêu đề: [STT, MSSV, Họ và tên, Lớp, Email]
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const mssvRaw = row.getCell(2).value?.toString()?.trim();
      const nameRaw = row.getCell(3).value?.toString()?.trim();
      const classRaw = row.getCell(4).value?.toString()?.trim() || '';
      const emailRaw = row.getCell(5).value?.toString()?.trim().toLowerCase();

      if (!mssvRaw && !nameRaw && !emailRaw) {
        continue; // Bỏ qua hàng trống
      }

      total++;

      if (!mssvRaw || !nameRaw || !emailRaw) {
        errors.push({
          row: rowNumber,
          reason: 'Thiếu thông tin bắt buộc (MSSV, Họ tên hoặc Email).',
        });
        continue;
      }

      try {
        const mssv = mssvRaw.toUpperCase();
        const nameNormalized = normalizeVietnamese(nameRaw);

        let user = await User.findOne({ mssv });
        if (!user) {
          const { token, expires } = AuthService.generateActivationToken();
          user = await User.create({
            mssv,
            nameRaw,
            nameNormalized,
            email: emailRaw,
            class: classRaw,
            role: 'student',
            isActive: false,
            activationToken: token,
            activationExpires: expires,
          });

          // Gửi thư kích hoạt qua Gmail
          await emailService.sendActivationEmail(user.email, user.nameRaw, token);
          imported++;
        } else {
          // Cập nhật thông tin nếu đã có
          user.nameRaw = nameRaw;
          user.nameNormalized = nameNormalized;
          user.email = emailRaw;
          user.class = classRaw;
          await user.save();
          imported++;
        }
      } catch (err: unknown) {
        errors.push({
          row: rowNumber,
          reason: (err as Error).message || 'Lỗi khi lưu dữ liệu sinh viên.',
        });
      }
    }

    return { total, imported, errors };
  }

  static async exportResultsToBuffer(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'E-Learning GDQP&AN';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Bảng Điểm GDQP&AN', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Cấu hình tiêu đề cột
    sheet.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Mã Sinh Viên', key: 'mssv', width: 14 },
      { header: 'Họ và Tên', key: 'name', width: 24 },
      { header: 'Lớp', key: 'class', width: 12 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Số bài đã Đạt', key: 'passedCount', width: 16 },
      { header: 'Trạng thái', key: 'status', width: 14 },
      { header: 'Thời gian hoàn thành', key: 'completedAt', width: 22 },
    ];

    // Định dạng tiêu đề hàng
    const headerRow = sheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A365D' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    const students = await User.find({ role: 'student' }).sort({ mssv: 1 }).lean();

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const enrollment = await Enrollment.findOne({ userId: s._id }).lean();
      const passedLessons = await LessonProgress.countDocuments({
        userId: s._id,
        passed: true,
      });

      const isAllPassed = enrollment?.allPassed || false;
      const statusText = isAllPassed ? 'ĐẠT' : 'CHƯA ĐẠT';
      const completedTime = enrollment?.completedAt
        ? new Date(enrollment.completedAt).toLocaleString('vi-VN')
        : '';

      const row = sheet.addRow({
        stt: i + 1,
        mssv: s.mssv,
        name: s.nameRaw,
        class: s.class || '',
        email: s.email,
        passedCount: passedLessons,
        status: statusText,
        completedAt: completedTime,
      });

      row.alignment = { vertical: 'middle' };
      row.getCell('stt').alignment = { horizontal: 'center' };
      row.getCell('mssv').alignment = { horizontal: 'center' };
      row.getCell('class').alignment = { horizontal: 'center' };
      row.getCell('passedCount').alignment = { horizontal: 'center' };
      row.getCell('status').alignment = { horizontal: 'center' };

      // Màu sắc trạng thái
      const statusCell = row.getCell('status');
      if (isAllPassed) {
        statusCell.font = { color: { argb: 'FF22543D' }, bold: true };
      } else {
        statusCell.font = { color: { argb: 'FF742A2A' }, bold: true };
      }
    }

    // Đóng khung toàn bộ các ô
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E0' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E0' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E0' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E0' } },
        };
      });
    });

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }

  /**
   * Import danh sách câu hỏi trắc nghiệm từ file Excel vào bài học
   */
  static async importQuestionsFromBuffer(
    lessonId: string,
    buffer: Buffer
  ): Promise<{
    total: number;
    imported: number;
    errors: { row: number; reason: string }[];
  }> {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error('Bài học không tồn tại.');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('File Excel không có dữ liệu bảng tính.');
    }

    let total = 0;
    let imported = 0;
    const errors: { row: number; reason: string }[] = [];

    // Hàng 1 là tiêu đề: [STT, Nội dung câu hỏi, Đáp án A, Đáp án B, Đáp án C, Đáp án D, Đáp án đúng, Lời giải thích]
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const text = row.getCell(2).value?.toString()?.trim();
      const choiceA = row.getCell(3).value?.toString()?.trim() || '';
      const choiceB = row.getCell(4).value?.toString()?.trim() || '';
      const choiceC = row.getCell(5).value?.toString()?.trim() || '';
      const choiceD = row.getCell(6).value?.toString()?.trim() || '';
      const correctRaw = row.getCell(7).value?.toString()?.trim().toUpperCase() || '';
      const explanation = row.getCell(8).value?.toString()?.trim() || '';

      if (!text && !choiceA && !choiceB) {
        continue; // Bỏ qua hàng trống
      }

      total++;

      if (!text) {
        errors.push({ row: rowNumber, reason: 'Nội dung câu hỏi không được để trống.' });
        continue;
      }

      const choices: { id: string; text: string }[] = [];
      if (choiceA) choices.push({ id: 'A', text: choiceA });
      if (choiceB) choices.push({ id: 'B', text: choiceB });
      if (choiceC) choices.push({ id: 'C', text: choiceC });
      if (choiceD) choices.push({ id: 'D', text: choiceD });

      if (choices.length < 2) {
        errors.push({ row: rowNumber, reason: 'Câu hỏi cần có tối thiểu 2 đáp án lựa chọn (A và B).' });
        continue;
      }

      if (!correctRaw) {
        errors.push({ row: rowNumber, reason: 'Chưa chỉ định đáp án đúng (A, B, C hoặc D).' });
        continue;
      }

      // Tách các đáp án đúng (hỗ trợ "A" hoặc "A, B"...)
      const correctIds = correctRaw
        .split(/[,;\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter((s) => ['A', 'B', 'C', 'D'].includes(s));

      if (correctIds.length === 0) {
        errors.push({
          row: rowNumber,
          reason: `Đáp án đúng "${correctRaw}" không hợp lệ. Phải là A, B, C hoặc D.`,
        });
        continue;
      }

      const availableIds = new Set(choices.map((c) => c.id));
      const hasInvalidChoice = correctIds.some((id) => !availableIds.has(id));
      if (hasInvalidChoice) {
        errors.push({
          row: rowNumber,
          reason: `Đáp án đúng "${correctRaw}" vượt quá số lựa chọn có trong câu hỏi.`,
        });
        continue;
      }

      try {
        await Question.create({
          lessonId: lesson._id,
          courseId: lesson.courseId,
          text,
          choices,
          correctIds,
          explanation,
          active: true,
        });
        imported++;
      } catch (err: unknown) {
        errors.push({ row: rowNumber, reason: (err as Error).message || 'Lỗi khi lưu câu hỏi.' });
      }
    }

    return { total, imported, errors };
  }

  /**
   * Xuất danh sách câu hỏi của bài học ra file Excel
   */
  static async exportQuestionsToBuffer(lessonId: string): Promise<Buffer> {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error('Bài học không tồn tại.');
    }

    const questions = await Question.find({ lessonId }).sort({ createdAt: 1 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'E-Learning GDQP&AN';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Ngân hàng câu hỏi', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Nội dung câu hỏi', key: 'text', width: 45 },
      { header: 'Đáp án A', key: 'choiceA', width: 25 },
      { header: 'Đáp án B', key: 'choiceB', width: 25 },
      { header: 'Đáp án C', key: 'choiceC', width: 25 },
      { header: 'Đáp án D', key: 'choiceD', width: 25 },
      { header: 'Đáp án đúng', key: 'correct', width: 15 },
      { header: 'Lời giải thích chi tiết', key: 'explanation', width: 40 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A365D' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    questions.forEach((q, idx) => {
      const choiceMap = new Map(q.choices.map((c) => [c.id, c.text]));
      const row = sheet.addRow({
        stt: idx + 1,
        text: q.text,
        choiceA: choiceMap.get('A') || '',
        choiceB: choiceMap.get('B') || '',
        choiceC: choiceMap.get('C') || '',
        choiceD: choiceMap.get('D') || '',
        correct: q.correctIds.join(', '),
        explanation: q.explanation || '',
      });

      row.getCell('stt').alignment = { horizontal: 'center' };
      row.getCell('correct').alignment = { horizontal: 'center' };
      row.alignment = { vertical: 'middle', wrapText: true };
    });

    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E0' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E0' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E0' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E0' } },
        };
      });
    });

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }

  /**
   * Tạo file Excel mẫu chuẩn nạp câu hỏi cho giáo viên/admin
   */
  static async generateQuestionTemplateBuffer(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'E-Learning GDQP&AN';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Mẫu nạp câu hỏi GDQP&AN', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Nội dung câu hỏi (*)', key: 'text', width: 45 },
      { header: 'Đáp án A (*)', key: 'choiceA', width: 25 },
      { header: 'Đáp án B (*)', key: 'choiceB', width: 25 },
      { header: 'Đáp án C', key: 'choiceC', width: 25 },
      { header: 'Đáp án D', key: 'choiceD', width: 25 },
      { header: 'Đáp án đúng (*) (A/B/C/D)', key: 'correct', width: 22 },
      { header: 'Lời giải thích chi tiết (Hiển thị khi SV làm sai)', key: 'explanation', width: 40 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 32;

    const sampleRows = [
      {
        stt: 1,
        text: 'Nền quốc phòng toàn dân của Việt Nam mang tính chất gì?',
        choiceA: 'Hòa bình, tự vệ và mang tính nhân dân sâu sắc.',
        choiceB: 'Răn đe quân sự và can thiệp vũ trang khu vực.',
        choiceC: 'Liên minh quân sự đối kháng.',
        choiceD: 'Tấn công phủ đầu từ xa.',
        correct: 'A',
        explanation: 'Luật Quốc phòng quy định nền quốc phòng toàn dân là nền quốc phòng của dân, do dân, vì dân, mang tính chất hòa bình và tự vệ.',
      },
      {
        stt: 2,
        text: 'Lực lượng vũ trang nhân dân Việt Nam gồm những thành phần nào?',
        choiceA: 'Quân đội nhân dân, Công an nhân dân và Dân quân tự vệ.',
        choiceB: 'Quân đội thường trực và Lực lượng dự bị động viên.',
        choiceC: 'Cảnh sát giao thông và Lực lượng cơ động.',
        choiceD: 'Công an nhân dân và Dân phòng đô thị.',
        correct: 'A',
        explanation: 'Theo Điều 23 Luật Quốc phòng: Lực lượng vũ trang nhân dân gồm Quân đội nhân dân, Công an nhân dân và Dân quân tự vệ.',
      },
    ];

    sampleRows.forEach((r) => {
      const row = sheet.addRow(r);
      row.getCell('stt').alignment = { horizontal: 'center' };
      row.getCell('correct').alignment = { horizontal: 'center' };
      row.alignment = { vertical: 'middle', wrapText: true };
    });

    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E0' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E0' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E0' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E0' } },
        };
      });
    });

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }
}
