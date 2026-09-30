import { z } from 'zod';

export const studentRowSchema = z.object({
  mssv: z.string().trim().min(1, 'MSSV không được để trống.'),
  name: z.string().trim().min(2, 'Họ tên quá ngắn.'),
  email: z.string().trim().email('Email không đúng định dạng.').toLowerCase(),
  class: z.string().trim().optional()
});

export const studentImportSchema = z.object({
  students: z.array(studentRowSchema).min(1, 'Danh sách sinh viên rỗng.')
});

export type StudentRowInput = z.infer<typeof studentRowSchema>;
export type StudentImportInput = z.infer<typeof studentImportSchema>;
