import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Vui lòng nhập Gmail hoặc MSSV.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

export const activateAccountSchema = z.object({
  token: z.string().trim().min(1, 'Mã xác thực không hợp lệ.'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có tối thiểu 6 ký tự.')
    .max(100, 'Mật khẩu quá dài.'),
});

// Form đăng ký trực tiếp bằng tài khoản mật khẩu
export const registerStudentSchema = z
  .object({
    name: z.string().trim().min(2, 'Họ và tên quá ngắn.'),
    mssv: z
      .string()
      .trim()
      .min(1, 'Mã số sinh viên (MSSV) không được để trống.')
      .toUpperCase(),
    phone: z
      .string()
      .trim()
      .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 0).'),
    school: z.string().trim().min(1, 'Vui lòng nhập tên Trường.'),
    class: z.string().trim().min(1, 'Vui lòng nhập tên Lớp.'),
    email: z.string().trim().email('Email không đúng định dạng.').toLowerCase(),
    password: z.string().min(6, 'Mật khẩu phải có tối thiểu 6 ký tự.'),
    confirmPassword: z.string().min(6, 'Vui lòng xác nhận mật khẩu.'),
    captchaId: z.string().min(1, 'Mã bảo vệ không hợp lệ.'),
    captchaAnswer: z.string().trim().min(1, 'Vui lòng nhập mã Captcha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp.',
    path: ['confirmPassword'],
  });

// Dữ liệu khi đăng ký hoặc hoàn tất qua Google
export const googleAuthSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ.').toLowerCase(),
  googleId: z.string().min(1, 'Google ID không hợp lệ.'),
  // Nếu là bước hoàn tất thông tin (đăng ký mới)
  name: z.string().trim().min(1, 'Họ và tên không được để trống.').optional(),
  mssv: z.string().trim().toUpperCase().optional(),
  phone: z.string().trim().optional(),
  school: z.string().trim().optional(),
  class: z.string().trim().optional(),
  password: z.string().min(6, 'Mật khẩu phải có tối thiểu 6 ký tự.').optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;
export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
