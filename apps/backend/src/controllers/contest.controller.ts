import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { ContestSubmission } from '../models/ContestSubmission.model.js';
import { StorageService } from '../services/storage.service.js';

export function convertScoreToWords(score: number): string {
  const digitWords = ['Không', 'Một', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười'];
  const integerPart = Math.floor(score);
  const decimalPart = Math.round((score - integerPart) * 100);

  if (decimalPart === 0) {
    return digitWords[integerPart] || `${score}`;
  }

  const intWord = digitWords[integerPart] || `${integerPart}`;
  if (decimalPart === 50 || decimalPart === 5) {
    return `${intWord} phẩy năm`;
  }
  if (decimalPart === 25) {
    return `${intWord} phẩy hai lăm`;
  }
  if (decimalPart === 75) {
    return `${intWord} phẩy bảy lăm`;
  }
  return `${intWord} phẩy ${decimalPart}`;
}

export function getRank(score: number): string {
  if (score >= 9.0) return 'Xuất sắc (Giải Nhất)';
  if (score >= 8.0) return 'Giỏi (Giải Nhì)';
  if (score >= 7.0) return 'Khá (Giải Ba)';
  if (score >= 5.0) return 'Đạt';
  return 'Chưa đạt';
}

export class ContestController {
  /**
   * Lấy danh sách 24 thí sinh cùng điểm và thống kê tổng quan
   */
  static async getSubmissions(_req: Request, res: Response): Promise<void> {
    try {
      const submissions = await ContestSubmission.find().sort({ stt: 1 }).lean();

      const totalCandidates = submissions.length;
      const graded = submissions.filter((s) => s.score && typeof s.score.totalScore === 'number');
      const gradedCount = graded.length;

      let averageScore = 0;
      let highestScore = 0;
      let topCandidate = null;

      if (gradedCount > 0) {
        const sum = graded.reduce((acc, curr) => acc + (curr.score?.totalScore || 0), 0);
        averageScore = Math.round((sum / gradedCount) * 100) / 100;

        const sortedByScore = [...graded].sort((a, b) => (b.score?.totalScore || 0) - (a.score?.totalScore || 0));
        highestScore = sortedByScore[0].score?.totalScore || 0;
        topCandidate = {
          stt: sortedByScore[0].stt,
          candidateName: sortedByScore[0].candidateName,
          score: sortedByScore[0].score?.totalScore,
        };
      }

      res.json({
        success: true,
        data: {
          submissions,
          stats: {
            totalCandidates,
            gradedCount,
            pendingCount: totalCandidates - gradedCount,
            averageScore,
            highestScore,
            topCandidate,
          },
        },
      });
    } catch (error) {
      console.error('Lỗi lấy danh sách bài thi video:', error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách thí sinh.' });
    }
  }

  /**
   * Lấy chi tiết bài thi của một thí sinh theo ID hoặc STT
   */
  static async getSubmissionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      let submission = null;
      if (/^\d+$/.test(id)) {
        submission = await ContestSubmission.findOne({ stt: Number(id) }).lean();
      } else {
        submission = await ContestSubmission.findById(id).lean();
      }

      if (!submission) {
        res.status(404).json({ success: false, message: 'Không tìm thấy thí sinh.' });
        return;
      }

      res.json({ success: true, data: submission });
    } catch (error) {
      console.error('Lỗi lấy chi tiết thí sinh:', error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
  }

  /**
   * Phát video bài thi hỗ trợ tua và streaming Range 206
   */
  static async streamSubmissionVideo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      let submission = null;
      if (/^\d+$/.test(id)) {
        submission = await ContestSubmission.findOne({ stt: Number(id) });
      } else {
        submission = await ContestSubmission.findById(id);
      }

      if (!submission || !submission.videoFileName) {
        res.status(404).json({ success: false, message: 'Video không tồn tại.' });
        return;
      }

      StorageService.streamVideo(req, res, submission.videoFileName);
    } catch (error) {
      console.error('Lỗi phát video thí sinh:', error);
      res.status(500).json({ success: false, message: 'Không thể phát video.' });
    }
  }

  /**
   * Ban giám khảo lưu điểm bài thi theo 7 tiêu chí barem chuẩn
   */
  static async updateJudgeScore(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        judgeName = 'Ban Giám Khảo Hội Thi',
        techDurationScore = 0,
        techSpecsScore = 0,
        techVisualScore = 0,
        techAudioScore = 0,
        contentTitleScore = 0,
        contentCoreScore = 0,
        contentCreativeScore = 0,
        note = '',
      } = req.body;

      let submission = null;
      if (/^\d+$/.test(id)) {
        submission = await ContestSubmission.findOne({ stt: Number(id) });
      } else {
        submission = await ContestSubmission.findById(id);
      }

      if (!submission) {
        res.status(404).json({ success: false, message: 'Không tìm thấy thí sinh.' });
        return;
      }

      const dur = Math.min(Math.max(Number(techDurationScore) || 0, 0), 1.0);
      const specs = Math.min(Math.max(Number(techSpecsScore) || 0, 0), 1.0);
      const visual = Math.min(Math.max(Number(techVisualScore) || 0, 0), 1.0);
      const audio = Math.min(Math.max(Number(techAudioScore) || 0, 0), 1.0);
      const title = Math.min(Math.max(Number(contentTitleScore) || 0, 0), 1.0);
      const core = Math.min(Math.max(Number(contentCoreScore) || 0, 0), 4.0);
      const creative = Math.min(Math.max(Number(contentCreativeScore) || 0, 0), 1.0);

      const total = Math.round((dur + specs + visual + audio + title + core + creative) * 100) / 100;
      const scoreInWords = convertScoreToWords(total);
      const rank = getRank(total);

      submission.score = {
        judgeName,
        techDurationScore: dur,
        techSpecsScore: specs,
        techVisualScore: visual,
        techAudioScore: audio,
        contentTitleScore: title,
        contentCoreScore: core,
        contentCreativeScore: creative,
        totalScore: total,
        scoreInWords,
        rank,
        note,
        evaluatedAt: new Date(),
      };

      await submission.save();

      res.json({
        success: true,
        message: `Đã lưu điểm cho thí sinh ${submission.candidateName}: ${total} điểm (${scoreInWords}).`,
        data: submission,
      });
    } catch (error) {
      console.error('Lỗi cập nhật điểm giám khảo:', error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lưu điểm.' });
    }
  }

  /**
   * Xuất Bảng điểm Giám khảo ra file Excel theo chuẩn mẫu phôi gốc
   */
  static async exportScoresExcel(req: Request, res: Response): Promise<void> {
    try {
      const judgeName = (req.query.judgeName as string) || 'Ban Giám Khảo';
      const submissions = await ContestSubmission.find().sort({ stt: 1 }).lean();

      // Tìm file mẫu template
      const templatePaths = [
        path.resolve(process.cwd(), 'templates', 'Danh sách điểm giám khảo chấm.xlsx'),
        path.resolve(process.cwd(), 'apps', 'backend', 'templates', 'Danh sách điểm giám khảo chấm.xlsx'),
        path.resolve(process.cwd(), 'temp_docs', 'Danh sách điểm giám khảo chấm.xlsx'),
        path.resolve(process.cwd(), '..', '..', 'temp_docs', 'Danh sách điểm giám khảo chấm.xlsx'),
      ];

      let templateFile = '';
      for (const p of templatePaths) {
        if (fs.existsSync(p)) {
          templateFile = p;
          break;
        }
      }

      const workbook = new ExcelJS.Workbook();

      if (templateFile) {
        await workbook.xlsx.readFile(templateFile);
        const worksheet = workbook.worksheets[0];

        // Dòng 4: Họ và tên Giám khảo chấm
        const cellA4 = worksheet.getCell('A4');
        cellA4.value = `Họ và tên Giám khảo chấm: ${judgeName}`;

        // Cập nhật điểm cho từng thí sinh từ dòng 6 đến 29
        submissions.forEach((sub, idx) => {
          const rowNumber = 6 + idx;
          const score = sub.score;

          if (score && typeof score.totalScore === 'number') {
            worksheet.getCell(`C${rowNumber}`).value = score.totalScore;
            worksheet.getCell(`D${rowNumber}`).value = score.scoreInWords || convertScoreToWords(score.totalScore);
            worksheet.getCell(`E${rowNumber}`).value = score.note || score.rank || '';
          }
        });

        // Cập nhật ngày tháng năm ở dòng 32
        const now = new Date();
        const dateStr = `Thành phố Hồ Chí Minh, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
        worksheet.getCell('C32').value = dateStr;
      } else {
        // Fallback tạo mới nếu không tìm thấy file mẫu
        const worksheet = workbook.addWorksheet('Danh Sách Điểm');

        worksheet.addRow(['ĐẠI HỌC QUỐC GIA TP. HCM - TRUNG TÂM GIÁO DỤC QUỐC PHÒNG VÀ AN NINH']);
        worksheet.addRow(['TP. Hồ Chí Minh, ngày ' + new Date().toLocaleDateString('vi-VN')]);
        worksheet.addRow(['DANH SÁCH ĐIỂM PHẦN THI XÂY DỰNG NỘI DUNG QUÁN TRIỆT ĐẦU KHÓA HỌC']);
        worksheet.addRow([`Họ và tên Giám khảo chấm: ${judgeName}`]);
        worksheet.addRow(['STT', 'Họ và tên', 'Điểm số', 'Điểm chữ', 'Ghi chú']);

        submissions.forEach((sub) => {
          worksheet.addRow([
            sub.stt,
            sub.candidateName,
            sub.score?.totalScore ?? '',
            sub.score?.scoreInWords ?? '',
            sub.score?.note ?? '',
          ]);
        });
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Danh_sach_diem_giam_khao_cham.xlsx"');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Lỗi xuất Excel bảng điểm:', error);
      res.status(500).json({ success: false, message: 'Lỗi xuất file Excel.' });
    }
  }
}
