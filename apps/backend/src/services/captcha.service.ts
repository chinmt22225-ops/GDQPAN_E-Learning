import crypto from 'crypto';
import { getRedisClient } from '../config/redis.js';

// In-memory fallback nếu Redis chưa sẵn sàng
const memoryStore = new Map<string, { answer: string; expires: number }>();

export class CaptchaService {
  private static readonly CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

  static async generateCaptcha(): Promise<{ captchaId: string; svg: string }> {
    // Sinh chuỗi 4 ký tự ngẫu nhiên
    let code = '';
    for (let i = 0; i < 4; i++) {
      const idx = crypto.randomInt(0, this.CHARS.length);
      code += this.CHARS[idx];
    }

    const captchaId = crypto.randomUUID();

    // Lưu vào Redis (TTL 5 phút)
    try {
      const redis = getRedisClient();
      await redis.set(`captcha:${captchaId}`, code.toUpperCase(), 'EX', 300);
    } catch {
      // Fallback in-memory
      memoryStore.set(captchaId, {
        answer: code.toUpperCase(),
        expires: Date.now() + 300 * 1000,
      });
    }

    // Vẽ hình ảnh SVG Captcha trực tiếp
    const width = 140;
    const height = 48;
    const colors = ['#2B6CB0', '#2C5282', '#2B6CB0', '#3182CE', '#1A365D'];

    // Các đường gợn sóng nhiễu
    const line1 = `<path d="M 0 ${crypto.randomInt(10, 40)} Q ${crypto.randomInt(30, 70)} ${crypto.randomInt(5, 45)}, 140 ${crypto.randomInt(10, 40)}" stroke="#CBD5E0" stroke-width="2" fill="none"/>`;
    const line2 = `<path d="M 0 ${crypto.randomInt(15, 35)} Q ${crypto.randomInt(50, 90)} ${crypto.randomInt(10, 40)}, 140 ${crypto.randomInt(15, 35)}" stroke="#E2E8F0" stroke-width="1.5" fill="none"/>`;

    // Vẽ từng ký tự với góc xoay ngẫu nhiên
    let textElements = '';
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const x = 20 + i * 28 + crypto.randomInt(-2, 3);
      const y = 33 + crypto.randomInt(-3, 3);
      const rotate = crypto.randomInt(-15, 15);
      const color = colors[i % colors.length];

      textElements += `
        <text 
          x="${x}" 
          y="${y}" 
          font-family="Arial, sans-serif" 
          font-size="26" 
          font-weight="bold" 
          fill="${color}" 
          transform="rotate(${rotate}, ${x}, ${y})"
        >${char}</text>
      `;
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="100%" height="100%" fill="#F8FAFC" rx="8" />
        ${line1}
        ${line2}
        ${textElements}
      </svg>
    `.trim();

    return {
      captchaId,
      svg: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    };
  }

  static async verifyCaptcha(captchaId: string, answer: string): Promise<boolean> {
    if (!captchaId || !answer) return false;

    const normalizedAnswer = answer.trim().toUpperCase();

    try {
      const redis = getRedisClient();
      const stored = await redis.get(`captcha:${captchaId}`);
      if (stored) {
        await redis.del(`captcha:${captchaId}`); // Xóa ngay sau khi dùng (1 lần duy nhất)
        return stored === normalizedAnswer;
      }
    } catch {
      // ignore
    }

    // Kiểm tra in-memory fallback
    const mem = memoryStore.get(captchaId);
    if (mem) {
      memoryStore.delete(captchaId);
      if (mem.expires > Date.now()) {
        return mem.answer === normalizedAnswer;
      }
    }

    return false;
  }
}
