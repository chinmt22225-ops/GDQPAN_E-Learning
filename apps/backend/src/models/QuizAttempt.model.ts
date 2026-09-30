import mongoose, { Schema, Document } from 'mongoose';
import { IQuestionSnapshot } from '@elearning/shared';

export interface IQuizAttemptDocument extends Document {
  userId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  questionSnapshots: IQuestionSnapshot[];
  score: number;
  passed: boolean;
  submittedAt: Date;
  createdAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttemptDocument>(
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
    questionSnapshots: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
        text: { type: String, required: true },
        choices: [
          {
            id: { type: String, required: true },
            text: { type: String, required: true },
          },
        ],
        selectedId: { type: String },
        isCorrect: { type: Boolean },
        correctAnswer: { type: String },
        explanation: { type: String },
      },
    ],
    score: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

QuizAttemptSchema.index({ userId: 1, lessonId: 1, submittedAt: -1 });

export const QuizAttempt = mongoose.model<IQuizAttemptDocument>(
  'QuizAttempt',
  QuizAttemptSchema
);
