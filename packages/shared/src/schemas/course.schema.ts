import { z } from 'zod';

export const createCourseSchema = z.object({
  code: z
    .string()
    .min(2, 'Mã học phần tối thiểu 2 ký tự')
    .max(30, 'Mã học phần tối đa 30 ký tự')
    .trim()
    .toUpperCase(),
  title: z
    .string()
    .min(3, 'Tên học phần tối thiểu 3 ký tự')
    .max(200, 'Tên học phần tối đa 200 ký tự')
    .trim(),
  description: z.string().max(1000).optional().default(''),
  coverImageKey: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export const updateCourseSchema = createCourseSchema.partial();

export const createLessonSchema = z.object({
  title: z
    .string()
    .min(3, 'Tên bài học tối thiểu 3 ký tự')
    .max(250, 'Tên bài học tối đa 250 ký tự')
    .trim(),
  order: z.number().int().min(1, 'Thứ tự bài học phải từ 1 trở lên').default(1),
  videoKey: z.string().optional().default(''),
  videoDurationSeconds: z.number().int().min(0).default(0),
  minCoveragePercent: z.number().min(0.01).max(1.0).default(0.95),
  passScore: z.number().int().min(1).max(10).default(8),
  totalQuestionsPerQuiz: z.number().int().min(1).max(50).default(10),
  active: z.boolean().optional().default(true),
});

export const updateLessonSchema = createLessonSchema.partial();

export const createQuestionSchema = z.object({
  text: z.string().min(5, 'Nội dung câu hỏi tối thiểu 5 ký tự').trim(),
  choices: z
    .array(
      z.object({
        id: z.string().min(1, 'Mã đáp án không hợp lệ'),
        text: z.string().min(1, 'Nội dung lựa chọn không được để trống').trim(),
      })
    )
    .min(2, 'Phải có tối thiểu 2 phương án lựa chọn')
    .max(6, 'Tối đa 6 phương án lựa chọn'),
  correctIds: z
    .array(z.string().min(1))
    .min(1, 'Phải chọn ít nhất 1 đáp án đúng'),
  explanation: z.string().max(2000).optional().default(''),
  active: z.boolean().optional().default(true),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
