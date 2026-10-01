import mongoose, { Schema, Document } from 'mongoose';

export interface IJudgeScore {
  judgeName: string;
  techDurationScore: number;    // Tiêu chí 1: Thời lượng 3-5 phút (tối đa 1.0)
  techSpecsScore: number;       // Tiêu chí 2: Dung lượng <= 300MB, MP4 16:9, HD (tối đa 1.0)
  techVisualScore: number;      // Tiêu chí 3: Hình ảnh rõ nét, không rung lắc (tối đa 1.0)
  techAudioScore: number;       // Tiêu chí 4: Âm thanh rõ ràng, không rè nhiễu (tối đa 1.0)
  contentTitleScore: number;    // Tiêu chí 5: Có tiêu đề video phù hợp (tối đa 1.0)
  contentCoreScore: number;     // Tiêu chí 6: Video truyền tải được nội dung quán triệt (tối đa 4.0)
  contentCreativeScore: number; // Tiêu chí 7: Có tính sáng tạo trong hình thức trình bày (tối đa 1.0)
  totalScore: number;           // Tổng điểm (thang 10.0)
  scoreInWords: string;         // Điểm bằng chữ (VD: "Tám phẩy năm")
  rank: string;                 // Xếp loại ("Xuất sắc" | "Giỏi" | "Khá" | "Đạt" | "Chưa đạt")
  note: string;
  evaluatedAt: Date;
}

export interface IContestSubmission extends Document {
  stt: number;
  candidateName: string;
  videoFileName: string;
  durationSeconds: number;
  fileSizeBytes: number;
  sizeMB: number;
  resolution: string;
  width: number;
  height: number;
  autoTechDurationScore: number;
  autoTechSpecsScore: number;
  score?: IJudgeScore;
  createdAt: Date;
  updatedAt: Date;
}

const JudgeScoreSchema = new Schema<IJudgeScore>(
  {
    judgeName: { type: String, default: 'Ban Giám Khảo' },
    techDurationScore: { type: Number, default: 0, min: 0, max: 1 },
    techSpecsScore: { type: Number, default: 0, min: 0, max: 1 },
    techVisualScore: { type: Number, default: 0, min: 0, max: 1 },
    techAudioScore: { type: Number, default: 0, min: 0, max: 1 },
    contentTitleScore: { type: Number, default: 0, min: 0, max: 1 },
    contentCoreScore: { type: Number, default: 0, min: 0, max: 4 },
    contentCreativeScore: { type: Number, default: 0, min: 0, max: 1 },
    totalScore: { type: Number, default: 0, min: 0, max: 10 },
    scoreInWords: { type: String, default: '' },
    rank: { type: String, default: '' },
    note: { type: String, default: '' },
    evaluatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ContestSubmissionSchema = new Schema<IContestSubmission>(
  {
    stt: { type: Number, required: true, unique: true },
    candidateName: { type: String, required: true },
    videoFileName: { type: String, required: true },
    durationSeconds: { type: Number, default: 0 },
    fileSizeBytes: { type: Number, default: 0 },
    sizeMB: { type: Number, default: 0 },
    resolution: { type: String, default: '1280x720' },
    width: { type: Number, default: 1280 },
    height: { type: Number, default: 720 },
    autoTechDurationScore: { type: Number, default: 0 },
    autoTechSpecsScore: { type: Number, default: 0 },
    score: { type: JudgeScoreSchema, required: false },
  },
  { timestamps: true }
);

export const ContestSubmission = mongoose.model<IContestSubmission>(
  'ContestSubmission',
  ContestSubmissionSchema
);
