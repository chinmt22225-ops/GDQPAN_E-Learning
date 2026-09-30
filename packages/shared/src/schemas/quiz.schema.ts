import { z } from 'zod';

export const quizSubmitSchema = z.object({
  answers: z.record(z.string(), z.string()).refine(
    (obj) => Object.keys(obj).length > 0,
    { message: 'Vui lòng hoàn thành các câu hỏi trong bài kiểm tra.' }
  )
});

export type QuizSubmitInput = z.infer<typeof quizSubmitSchema>;
