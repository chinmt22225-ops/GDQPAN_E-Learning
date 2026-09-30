import mongoose, { Schema, Document } from 'mongoose';
import { IChoice } from '@elearning/shared';

export interface IQuestionDocument extends Document {
  lessonId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  text: string;
  choices: IChoice[];
  correctIds: string[];
  explanation?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestionDocument>(
  {
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
    text: {
      type: String,
      required: true,
      trim: true,
    },
    choices: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
      },
    ],
    correctIds: {
      type: [String],
      required: true,
    },
    explanation: {
      type: String,
      trim: true,
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

QuestionSchema.index({ lessonId: 1, active: 1 });

export const Question = mongoose.model<IQuestionDocument>('Question', QuestionSchema);
