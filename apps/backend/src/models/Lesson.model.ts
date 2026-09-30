import mongoose, { Schema, Document } from 'mongoose';

export interface ILessonDocument extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  order: number;
  videoKey?: string;
  videoDurationSeconds: number;
  minCoveragePercent: number;
  passScore: number;
  totalQuestionsPerQuiz: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILessonDocument>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 1,
    },
    videoKey: {
      type: String,
    },
    videoDurationSeconds: {
      type: Number,
      default: 0,
    },
    minCoveragePercent: {
      type: Number,
      default: 0.95, // Yêu cầu xem >= 95%
    },
    passScore: {
      type: Number,
      default: 8, // Điểm tối thiểu đạt bài học (8/10)
    },
    totalQuestionsPerQuiz: {
      type: Number,
      default: 10,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

LessonSchema.index({ courseId: 1, order: 1 });

export const Lesson = mongoose.model<ILessonDocument>('Lesson', LessonSchema);
