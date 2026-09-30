import { Request, Response } from 'express';
import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { LessonProgress } from '../models/LessonProgress.model.js';
import { VideoService } from '../services/video.service.js';
import { QuizService } from '../services/quiz.service.js';

export class StudentController {
  static async getCourses(_req: Request, res: Response): Promise<void> {
    const courses = await Course.find({ active: true }).sort({ code: 1 }).lean();
    res.json({ success: true, data: courses });
  }

  static async getCourseLessons(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const courseId = req.params.courseId;

    const lessons = await Lesson.find({ courseId, active: true }).sort({ order: 1 }).lean();
    const progresses = await LessonProgress.find({ userId, courseId }).lean();

    const progressMap = new Map(progresses.map((p) => [p.lessonId.toString(), p]));

    const lessonsWithProgress = lessons.map((lesson) => {
      const p = progressMap.get(lesson._id.toString());
      return {
        ...lesson,
        progress: {
          status: p?.status || 'NOT_STARTED',
          coveragePercent: p ? Math.round(p.coveragePercent * 100) : 0,
          videoCompleted: p?.videoCompleted || false,
          passed: p?.passed || false,
          highestScore: p?.highestScore || 0,
          attemptsCount: p?.attemptsCount || 0,
        },
      };
    });

    res.json({ success: true, data: lessonsWithProgress });
  }

  static async heartbeat(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const lessonId = req.params.lessonId;
    const { currentTime, playing, playbackRate } = req.body;

    try {
      const result = await VideoService.recordHeartbeat(userId, lessonId, {
        currentTime: Number(currentTime),
        playing: Boolean(playing),
        playbackRate: Number(playbackRate || 1.0),
      });

      res.json({ success: true, data: result });
    } catch (err: unknown) {
      res.status(400).json({ success: false, message: (err as Error).message });
    }
  }

  static async getQuiz(req: Request, res: Response): Promise<void> {
    const lessonId = req.params.lessonId;

    try {
      const questions = await QuizService.getQuizQuestions(lessonId);
      res.json({ success: true, data: questions });
    } catch (err: unknown) {
      res.status(400).json({ success: false, message: (err as Error).message });
    }
  }

  static async submitQuiz(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const lessonId = req.params.lessonId;
    const { answers } = req.body;

    try {
      const result = await QuizService.submitQuiz(userId, lessonId, answers);
      res.json({
        success: true,
        message: result.passed ? 'Chúc mừng! Bạn đã đạt bài học này.' : 'Chưa đạt yêu cầu. Bạn có thể làm lại để nâng điểm.',
        data: result,
      });
    } catch (err: unknown) {
      res.status(400).json({ success: false, message: (err as Error).message });
    }
  }
}
