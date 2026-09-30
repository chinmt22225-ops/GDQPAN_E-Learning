import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseDocument extends Document {
  code: string;
  title: string;
  description?: string;
  coverImageKey?: string;
  totalLessons: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourseDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    coverImageKey: {
      type: String,
    },
    totalLessons: {
      type: Number,
      default: 0,
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

export const Course = mongoose.model<ICourseDocument>('Course', CourseSchema);
