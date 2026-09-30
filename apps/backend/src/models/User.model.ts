import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@elearning/shared';

export interface IUserDocument extends Document {
  mssv: string;
  nameRaw: string;
  nameNormalized: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  class?: string;
  school?: string;
  googleId?: string;
  isActive: boolean;
  activationToken?: string;
  activationExpires?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    mssv: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    nameRaw: {
      type: String,
      required: true,
      trim: true,
    },
    nameNormalized: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
      index: true,
    },
    school: {
      type: String,
      trim: true,
    },
    class: {
      type: String,
      trim: true,
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    activationToken: {
      type: String,
    },
    activationExpires: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Helper function để chuẩn hóa tiếng Việt không dấu (NFC)
export const normalizeVietnamese = (str: string): string => {
  return str
    .normalize('NFC')
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);
