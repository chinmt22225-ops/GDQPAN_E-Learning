import ExcelJS from 'exceljs';
import { User, normalizeVietnamese } from '../models/User.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { LessonProgress } from '../models/LessonProgress.model.js';
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
}
