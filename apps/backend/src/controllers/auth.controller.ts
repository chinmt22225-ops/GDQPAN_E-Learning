import { Request, Response } from 'express';
import { User } from '../models/User.model.js';
import { AuthService } from '../services/auth.service.js';
import { ENV } from '../config/env.config.js';

export class AuthController {
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
        message: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để đặt mật khẩu.',
      });
      return;
    }

    if (!user.passwordHash) {
      res.status(401).json({ success: false, message: 'Tài khoản chưa thiết lập mật khẩu.' });
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
    };

    const accessToken = AuthService.generateAccessToken(sessionData);

    user.lastLoginAt = new Date();
    await user.save();

    // Thiết lập HttpOnly Cookie bảo mật
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
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
