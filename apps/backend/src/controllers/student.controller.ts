import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { LessonProgress } from '../models/LessonProgress.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { VideoService } from '../services/video.service.js';
import { QuizService } from '../services/quiz.service.js';
import { StorageService } from '../services/storage.service.js';
import { getRedisClient } from '../config/redis.js';

export class StudentController {
  static async getCourses(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    const courses = await Course.find({ active: true }).sort({ code: 1 }).lean();
    if (!courses.length) {
      res.json({ success: true, data: [] });
      return;
    }

    const courseIds = courses.map((c) => c._id);
    const [lessonCounts, passedProgresses, enrollments] = await Promise.all([
      Lesson.aggregate([
        { $match: { courseId: { $in: courseIds }, active: true } },
        { $group: { _id: '$courseId', count: { $sum: 1 } } },
      ]),
      userId
        ? LessonProgress.aggregate([
            {
              $match: {
                userId: new mongoose.Types.ObjectId(userId),
                courseId: { $in: courseIds },
                passed: true,
              },
            },
            { $group: { _id: '$courseId', count: { $sum: 1 } } },
          ])
        : Promise.resolve([]),
      userId
        ? Enrollment.find({ userId, courseId: { $in: courseIds } }).lean()
        : Promise.resolve([]),
    ]);

    const totalLessonsMap = new Map(lessonCounts.map((l) => [l._id.toString(), l.count]));
    const passedCountMap = new Map(passedProgresses.map((p) => [p._id.toString(), p.count]));
    const enrollmentMap = new Map(enrollments.map((e) => [e.courseId.toString(), e]));

    const enrichedCourses = courses.map((c) => {
      const cIdStr = c._id.toString();
      const totalLessons = totalLessonsMap.get(cIdStr) || 0;
      const passedLessonsCount = passedCountMap.get(cIdStr) || 0;
      const enrollment = enrollmentMap.get(cIdStr);
      const allPassed = Boolean(
        enrollment?.allPassed || (totalLessons > 0 && passedLessonsCount >= totalLessons)
      );
      const progressPercent =
        totalLessons > 0 ? Math.round((passedLessonsCount / totalLessons) * 100) : 0;

      return {
        ...c,
        totalLessons,
        passedLessonsCount,
        allPassed,
        progressPercent,
        completedAt: enrollment?.completedAt,
      };
    });

    res.json({ success: true, data: enrichedCourses });
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
          // Khi vào lại học bài giảng: Nếu chưa hoàn thành thì thanh tiến độ reset về 0%
          coveragePercent: p?.videoCompleted ? 100 : (p?.passed ? Math.round(p.coveragePercent * 100) : 0),
          videoCompleted: p?.videoCompleted || false,
          passed: p?.passed || false,
          highestScore: p?.highestScore || 0,
          attemptsCount: p?.attemptsCount || 0,
        },
      };
    });

    res.json({ success: true, data: lessonsWithProgress });
  }

  static async getLessonStream(req: Request, res: Response): Promise<void> {
    const lessonId = req.params.lessonId;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bài học.' });
      return;
    }
    StorageService.streamVideo(req, res, lesson.videoKey || '');
  }

  static async heartbeat(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const lessonId = req.params.lessonId;
    const { currentTime, playing, playbackRate, duration } = req.body;

    try {
      const result = await VideoService.recordHeartbeat(userId, lessonId, {
        currentTime: Number(currentTime),
        playing: Boolean(playing),
        playbackRate: Number(playbackRate || 1.0),
        duration: duration ? Number(duration) : undefined,
      });

      res.json({ success: true, data: result });
    } catch (err: unknown) {
      res.status(400).json({ success: false, message: (err as Error).message });
    }
  }

  static async resetLessonProgress(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const lessonId = req.params.lessonId;

    try {
      const progress = await LessonProgress.findOne({ userId, lessonId });
      if (progress) {
        progress.coveredBlocks = [];
        progress.coveragePercent = 0;
        // Nếu chưa hoàn thành bài thi trắc nghiệm thì làm mới lại trạng thái xem video
        if (!progress.passed) {
          progress.videoCompleted = false;
          if (progress.status === 'WATCHING' || progress.status === 'QUIZ_UNLOCKED') {
            progress.status = 'WATCHING';
          }
        }
        await progress.save();
      }

      const redis = getRedisClient();
      await redis.del(`heartbeat:${userId}:${lessonId}`).catch(() => {});

      res.json({
        success: true,
        message: 'Đã thiết lập lại tiến độ xem video bài học về 0%.',
        data: {
          coveragePercent: 0,
          videoCompleted: progress?.videoCompleted || false,
        },
      });
    } catch {
      res.status(500).json({ success: false, message: 'Lỗi khi reset tiến độ bài học.' });
    }
  }

  static async getQuiz(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const lessonId = req.params.lessonId;
    const isAdmin = req.user?.role === 'admin';

    try {
      const questions = await QuizService.getQuizQuestions(userId, lessonId, isAdmin);
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
