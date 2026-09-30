import mongoose, { Schema, Document } from 'mongoose';
import { LessonProgressStatus } from '@elearning/shared';

export interface ILessonProgressDocument extends Document {
  userId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  coveredBlocks: number[]; // Các block 5 giây đã xem thực tế
  coveragePercent: number;
  videoCompleted: boolean;
  highestScore: number;
  attemptsCount: number;
  passed: boolean;
  passedAt?: Date;
  status: LessonProgressStatus;
  updatedAt: Date;
  createdAt: Date;
}

const LessonProgressSchema = new Schema<ILessonProgressDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    coveredBlocks: {
      type: [Number],
      default: [],
    },
    coveragePercent: {
      type: Number,
      default: 0,
    },
    videoCompleted: {
      type: Boolean,
      default: false,
    },
    highestScore: {
      type: Number,
      default: 0,
    },
    attemptsCount: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
      index: true,
    },
    passedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'WATCHING', 'QUIZ_UNLOCKED', 'PASSED', 'FAILED'],
      default: 'NOT_STARTED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Một sinh viên chỉ có một bản ghi tiến độ duy nhất cho một bài học
LessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
LessonProgressSchema.index({ courseId: 1, passed: 1 });

export const LessonProgress = mongoose.model<ILessonProgressDocument>(
  'LessonProgress',
  LessonProgressSchema
);
