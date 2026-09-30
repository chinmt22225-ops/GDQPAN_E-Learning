import { Request, Response } from 'express';
import { User, normalizeVietnamese } from '../models/User.model.js';
import { Course } from '../models/Course.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { AuthService } from '../services/auth.service.js';
import { CaptchaService } from '../services/captcha.service.js';
import { ENV } from '../config/env.config.js';

export class AuthController {
  /**
   * Sinh mã Captcha bảo vệ
   */
  static async getCaptcha(_req: Request, res: Response): Promise<void> {
    try {
      const captcha = await CaptchaService.generateCaptcha();
      res.json({
        success: true,
        data: captcha,
      });
    } catch (err: unknown) {
      res.status(500).json({ success: false, message: 'Lỗi khi tạo mã bảo vệ.' });
    }
  }

  /**
   * Đăng ký tài khoản sinh viên trực tiếp qua form
   */
  static async register(req: Request, res: Response): Promise<void> {
    const { name, mssv, school, class: className, email, password, captchaId, captchaAnswer } = req.body;

    // 1. Xác thực mã Captcha
    const isCaptchaValid = await CaptchaService.verifyCaptcha(captchaId, captchaAnswer);
    if (!isCaptchaValid) {
      res.status(400).json({
        success: false,
        message: 'Mã bảo vệ (Captcha) không chính xác hoặc đã hết hạn. Vui lòng thử lại.',
      });
      return;
    }

    const cleanMssv = String(mssv || '').trim().toUpperCase();
    const cleanEmail = String(email || '').trim().toLowerCase();

    // 2. Kiểm tra trùng MSSV
    const existingMssv = await User.findOne({ mssv: cleanMssv });
    if (existingMssv) {
      res.status(400).json({
        success: false,
        message: `Mã số sinh viên "${cleanMssv}" đã được đăng ký trong hệ thống. Vui lòng đăng nhập hoặc liên hệ quản trị viên.`,
      });
      return;
    }

    // 3. Kiểm tra trùng Email
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      res.status(400).json({
        success: false,
        message: `Email "${cleanEmail}" đã được sử dụng cho một tài khoản khác.`,
      });
      return;
    }

    // 4. Mã hóa mật khẩu argon2id & Chuẩn hóa họ tên
    const passwordHash = await AuthService.hashPassword(password);
    const nameNormalized = normalizeVietnamese(name);

    // 5. Tạo tài khoản sinh viên
    const newUser = await User.create({
      mssv: cleanMssv,
      nameRaw: name.trim(),
      nameNormalized,
      email: cleanEmail,
      school: String(school || '').trim(),
      class: String(className || '').trim(),
      passwordHash,
      role: 'student',
      isActive: true, // Kích hoạt ngay lập tức
    });

    // 6. Tự động ghi danh vào các khóa học đang mở
    try {
      const activeCourses = await Course.find({ active: true });
      for (const course of activeCourses) {
        await Enrollment.create({
          userId: newUser._id,
          courseId: course._id,
          completedLessons: [],
          allPassed: false,
        });
      }
    } catch {
      // ignore
    }

    // 7. Cấp phiên đăng nhập tự động
    const sessionData = {
      userId: newUser._id.toString(),
      mssv: newUser.mssv,
      name: newUser.nameRaw,
      email: newUser.email,
      role: newUser.role,
      school: newUser.school,
      class: newUser.class,
    };

    const accessToken = AuthService.generateAccessToken(sessionData);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      data: {
        user: sessionData,
        token: accessToken,
      },
    });
  }

  /**
   * Đăng ký / Đăng nhập qua Google OAuth
   * Bắt buộc phải có MSSV và Họ Tên
   */
  static async googleAuth(req: Request, res: Response): Promise<void> {
    const { email, name, googleId, mssv, school, class: className } = req.body;

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanGoogleId = String(googleId || '').trim();
    const cleanMssv = String(mssv || '').trim().toUpperCase();

    if (!cleanMssv) {
      res.status(400).json({
        success: false,
        message: 'Bắt buộc phải nhập Mã số sinh viên (MSSV) để lưu trữ kết quả học phần.',
      });
      return;
    }

    // Tìm user theo googleId hoặc email
    let user = await User.findOne({
      $or: [{ googleId: cleanGoogleId }, { email: cleanEmail }],
    });

    if (user) {
      // User đã có tài khoản, cập nhật thông tin nếu thiếu
      let updated = false;
      if (!user.googleId) {
        user.googleId = cleanGoogleId;
        updated = true;
      }
      if (!user.mssv || user.mssv !== cleanMssv) {
        // Kiểm tra xem MSSV mới có bị trùng tài khoản khác không
        const mssvTaken = await User.findOne({ mssv: cleanMssv, _id: { $ne: user._id } });
        if (mssvTaken) {
          res.status(400).json({
            success: false,
            message: `Mã số sinh viên "${cleanMssv}" đã thuộc về tài khoản khác.`,
          });
          return;
        }
        user.mssv = cleanMssv;
        updated = true;
      }
      if (school && !user.school) {
        user.school = String(school).trim();
        updated = true;
      }
      if (className && !user.class) {
        user.class = String(className).trim();
        updated = true;
      }

      if (updated) {
        await user.save();
      }
    } else {
      // User mới, kiểm tra trùng MSSV
      const mssvExists = await User.findOne({ mssv: cleanMssv });
      if (mssvExists) {
        res.status(400).json({
          success: false,
          message: `Mã số sinh viên "${cleanMssv}" đã được đăng ký trong hệ thống. Vui lòng đăng nhập bằng mật khẩu hoặc liên kết tài khoản.`,
        });
        return;
      }

      const nameRaw = String(name || '').trim() || 'Sinh Viên';
      const nameNormalized = normalizeVietnamese(nameRaw);

      user = await User.create({
        googleId: cleanGoogleId,
        mssv: cleanMssv,
        nameRaw,
        nameNormalized,
        email: cleanEmail,
        school: String(school || '').trim(),
        class: String(className || '').trim(),
        role: 'student',
        isActive: true,
      });

      // Tự động ghi danh vào các khóa học đang mở
      try {
        const activeCourses = await Course.find({ active: true });
        for (const course of activeCourses) {
          await Enrollment.create({
            userId: user._id,
            courseId: course._id,
            completedLessons: [],
            allPassed: false,
          });
        }
      } catch {
        // ignore
      }
    }

    const sessionData = {
      userId: user._id.toString(),
      mssv: user.mssv,
      name: user.nameRaw,
      email: user.email,
      role: user.role,
      school: user.school,
      class: user.class,
    };

    const accessToken = AuthService.generateAccessToken(sessionData);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Đăng nhập Google thành công!',
      data: {
        user: sessionData,
        token: accessToken,
      },
    });
  }

  /**
   * Đăng nhập tiêu chuẩn bằng MSSV hoặc Email
   */
  static async login(req: Request, res: Response): Promise<void> {
    const { identifier, password } = req.body;
    const cleanId = String(identifier || '').trim();

    // Tìm theo MSSV (in hoa) hoặc Email (chữ thường)
    const user = await User.findOne({
      $or: [{ mssv: cleanId.toUpperCase() }, { email: cleanId.toLowerCase() }],
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Tài khoản chưa được kích hoạt. Vui lòng kích hoạt tài khoản để tiếp tục.',
      });
      return;
    }

    if (!user.passwordHash) {
      res.status(401).json({
        success: false,
        message: 'Tài khoản này được đăng ký qua Google. Vui lòng đăng nhập bằng Google.',
      });
      return;
    }

    const isMatch = await AuthService.verifyPassword(user.passwordHash, password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác.' });
      return;
    }

    const sessionData = {
      userId: user._id.toString(),
      mssv: user.mssv,
      name: user.nameRaw,
      email: user.email,
      role: user.role,
      school: user.school,
      class: user.class,
    };

    const accessToken = AuthService.generateAccessToken(sessionData);

    user.lastLoginAt = new Date();
    await user.save();

    // Thiết lập HttpOnly Cookie bảo mật
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Đăng nhập thành công.',
      data: {
        user: sessionData,
        token: accessToken,
      },
    });
  }

  static async activate(req: Request, res: Response): Promise<void> {
    const { token, password } = req.body;

    const user = await User.findOne({
      activationToken: token,
      activationExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Mã kích hoạt không hợp lệ hoặc đã hết hạn (quá 72 giờ).',
      });
      return;
    }

    const hash = await AuthService.hashPassword(password);
    user.passwordHash = hash;
    user.isActive = true;
    user.activationToken = undefined;
    user.activationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Kích hoạt tài khoản thành công! Bây giờ bạn có thể đăng nhập.',
    });
  }

  static async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
      return;
    }
    res.json({ success: true, data: { user: req.user } });
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('access_token');
    res.json({ success: true, message: 'Đăng xuất thành công.' });
  }
}
