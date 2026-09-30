import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env.config.js';
import { UserSessionData } from '@elearning/shared';

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
    });
  }

  static async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  static generateAccessToken(user: UserSessionData): string {
    return jwt.sign(user, ENV.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });
  }

  static generateRefreshToken(user: UserSessionData): string {
    return jwt.sign(user, ENV.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });
  }

  static verifyAccessToken(token: string): UserSessionData | null {
    try {
      return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as UserSessionData;
    } catch {
      return null;
    }
  }

  static generateActivationToken(): { token: string; expires: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 giờ
    return { token, expires };
  }
}
