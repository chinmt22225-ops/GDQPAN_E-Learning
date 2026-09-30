import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Vui lòng nhập MSSV hoặc Email.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

export const activateAccountSchema = z.object({
  token: z.string().trim().min(1, 'Mã xác thực không hợp lệ.'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có tối thiểu 6 ký tự.')
    .max(100, 'Mật khẩu quá dài.'),
});

export const registerStudentSchema = z
  .object({
    name: z.string().trim().min(2, 'Họ và tên quá ngắn.'),
    mssv: z
      .string()
      .trim()
      .min(1, 'Mã số sinh viên (MSSV) không được để trống.')
      .toUpperCase(),
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

export const googleAuthSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ.').toLowerCase(),
  name: z.string().trim().min(1, 'Họ và tên không được để trống.'),
  googleId: z.string().min(1, 'Google ID không hợp lệ.'),
  mssv: z
    .string()
    .trim()
    .min(1, 'Bắt buộc phải nhập MSSV để lưu trữ dữ liệu học phần.')
    .toUpperCase(),
  school: z.string().trim().optional(),
  class: z.string().trim().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;
export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
