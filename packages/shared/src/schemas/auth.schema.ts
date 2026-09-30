import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Vui lòng nhập MSSV hoặc Email.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.')
});

export const activateAccountSchema = z.object({
  token: z.string().trim().min(1, 'Mã xác thực không hợp lệ.'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có tối thiểu 6 ký tự.')
    .max(100, 'Mật khẩu quá dài.')
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;
