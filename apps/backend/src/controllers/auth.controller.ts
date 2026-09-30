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
   * Đăng ký tài khoản sinh viên trực tiếp bằng biểu mẫu (MSSV, SĐT, Trường, Lớp, Mật khẩu, Captcha)
   */
  static async register(req: Request, res: Response): Promise<void> {
    const {
      name,
      mssv,
      phone,
      school,
      class: className,
      email,
      password,
      captchaId,
      captchaAnswer,
    } = req.body;

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
    const cleanPhone = String(phone || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();

    // 2. Kiểm tra trùng MSSV
    const existingMssv = await User.findOne({ mssv: cleanMssv });
    if (existingMssv) {
      res.status(400).json({
        success: false,
        message: `Mã số sinh viên "${cleanMssv}" đã được đăng ký trong hệ thống. Vui lòng đăng nhập bằng MSSV của bạn.`,
      });
      return;
    }

    // 3. Kiểm tra trùng Số điện thoại
    if (cleanPhone) {
      const existingPhone = await User.findOne({ phone: cleanPhone });
      if (existingPhone) {
        res.status(400).json({
          success: false,
          message: `Số điện thoại "${cleanPhone}" đã được sử dụng cho một tài khoản khác.`,
        });
        return;
      }
    }

    // 4. Kiểm tra trùng Email
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      res.status(400).json({
        success: false,
        message: `Email "${cleanEmail}" đã được sử dụng cho một tài khoản khác.`,
      });
      return;
    }

    // 5. Mã hóa mật khẩu argon2id & Chuẩn hóa họ tên
    const passwordHash = await AuthService.hashPassword(password);
    const nameNormalized = normalizeVietnamese(name);

    // 6. Tạo tài khoản sinh viên
    const newUser = await User.create({
      mssv: cleanMssv,
      phone: cleanPhone,
      nameRaw: name.trim(),
      nameNormalized,
      email: cleanEmail,
      school: String(school || '').trim(),
      class: String(className || '').trim(),
      passwordHash,
      role: 'student',
      isActive: true, // Kích hoạt ngay
    });

    // 7. Tự động ghi danh vào các khóa học đang mở
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

    // 8. Cấp phiên đăng nhập tự động
    const sessionData = {
      userId: newUser._id.toString(),
      mssv: newUser.mssv,
      phone: newUser.phone,
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
   * - Nếu tài khoản Google đã tồn tại -> Đăng nhập ngay.
   * - Nếu tài khoản Google chưa tồn tại và chưa nhập MSSV/SĐT/Mật khẩu -> Báo isNewUser: true để chuyển sang trang hoàn tất thông tin.
   * - Nếu tài khoản Google mới và đã có MSSV, SĐT, Mật khẩu -> Tạo user và lưu mật khẩu để sau này có thể đăng nhập bằng cả 2 cách!
   */
  static async googleAuth(req: Request, res: Response): Promise<void> {
    const { email, googleId, name, mssv, phone, school, class: className, password } = req.body;

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanGoogleId = String(googleId || '').trim();

    // 1. Kiểm tra tài khoản đã tồn tại theo googleId hoặc email chưa
    let user = await User.findOne({
      $or: [{ googleId: cleanGoogleId }, { email: cleanEmail }],
    });

    // TRƯỜNG HỢP 1: Tài khoản đã tồn tại -> Đăng nhập ngay lập tức
    if (user) {
      if (!user.googleId) {
        user.googleId = cleanGoogleId;
        await user.save();
      }

      const sessionData = {
        userId: user._id.toString(),
        mssv: user.mssv,
        phone: user.phone,
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
        isNewUser: false,
        message: 'Đăng nhập Google thành công!',
        data: {
          isNewUser: false,
          user: sessionData,
          token: accessToken,
        },
      });
      return;
    }

    // TRƯỜNG HỢP 2: Tài khoản chưa tồn tại nhưng CHƯA có MSSV / SĐT / Mật khẩu
    // -> Báo cho Frontend chuyển tới trang nhập thông tin bổ sung
    const cleanMssv = String(mssv || '').trim().toUpperCase();
    const cleanPhone = String(phone || '').trim();

    if (!cleanMssv || !cleanPhone || !password) {
      res.json({
        success: true,
        isNewUser: true,
        message: 'Tài khoản Google mới. Vui lòng hoàn tất thông tin bổ sung.',
        data: {
          isNewUser: true,
          googleId: cleanGoogleId,
          email: cleanEmail,
          name: name ? String(name).trim() : '',
        },
      });
      return;
    }

    // TRƯỜNG HỢP 3: Đăng ký mới với đầy đủ thông tin (MSSV, SĐT, Trường, Lớp, Mật khẩu)
    // Kiểm tra trùng MSSV
    const existingMssv = await User.findOne({ mssv: cleanMssv });
    if (existingMssv) {
      res.status(400).json({
        success: false,
        message: `Mã số sinh viên "${cleanMssv}" đã được đăng ký trong hệ thống. Vui lòng kiểm tra lại.`,
      });
      return;
    }

    // Kiểm tra trùng SĐT
    const existingPhone = await User.findOne({ phone: cleanPhone });
    if (existingPhone) {
      res.status(400).json({
        success: false,
        message: `Số điện thoại "${cleanPhone}" đã được sử dụng cho một tài khoản khác.`,
      });
      return;
    }

    // Băm mật khẩu để sau này sinh viên có thể đăng nhập bằng cả 2 cách:
    // Cách 1: Bấm nút Google
    // Cách 2: Gõ MSSV hoặc SĐT + Mật khẩu này
    const passwordHash = await AuthService.hashPassword(password);
    const nameRaw = String(name || '').trim() || 'Sinh Viên';
    const nameNormalized = normalizeVietnamese(nameRaw);

    user = await User.create({
      googleId: cleanGoogleId,
      mssv: cleanMssv,
      phone: cleanPhone,
      nameRaw,
      nameNormalized,
      email: cleanEmail,
      school: String(school || '').trim(),
      class: String(className || '').trim(),
      passwordHash,
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

    const sessionData = {
      userId: user._id.toString(),
      mssv: user.mssv,
      phone: user.phone,
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

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản Google thành công!',
      data: {
        user: sessionData,
        token: accessToken,
      },
    });
  }

  /**
   * Đăng nhập trực tiếp bằng MSSV hoặc Số điện thoại (hoặc Email) + Mật khẩu
   */
  static async login(req: Request, res: Response): Promise<void> {
    const { identifier, password } = req.body;
    const cleanId = String(identifier || '').trim();

    // Tìm theo MSSV (in hoa), Số điện thoại hoặc Email
    const user = await User.findOne({
      $or: [
        { mssv: cleanId.toUpperCase() },
        { phone: cleanId },
        { email: cleanId.toLowerCase() },
      ],
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Gmail hoặc Mã số sinh viên (MSSV) không tồn tại.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Tài khoản chưa được kích hoạt. Vui lòng liên hệ quản trị viên.',
      });
      return;
    }

    if (!user.passwordHash) {
      res.status(401).json({
        success: false,
        message: 'Tài khoản này chưa có mật khẩu trực tiếp. Vui lòng bấm "Đăng nhập bằng Google".',
      });
      return;
    }

    const isMatch = await AuthService.verifyPassword(user.passwordHash, password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Mật khẩu không chính xác.' });
      return;
    }

    const sessionData = {
      userId: user._id.toString(),
      mssv: user.mssv,
      phone: user.phone,
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
