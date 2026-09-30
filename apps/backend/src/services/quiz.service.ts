import { Lesson } from '../models/Lesson.model.js';
import { Question } from '../models/Question.model.js';
import { LessonProgress } from '../models/LessonProgress.model.js';
import { QuizAttempt } from '../models/QuizAttempt.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { User } from '../models/User.model.js';
import { sseService } from './sse.service.js';
import { IQuizQuestionForStudent, QuizDetailedFeedback, QuizResultResponse } from '@elearning/shared';

export class QuizService {
  static async getQuizQuestions(lessonId: string): Promise<IQuizQuestionForStudent[]> {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error('Bài học không tồn tại.');
    }

    const quizSize = lesson.totalQuestionsPerQuiz || 10;

    // Lấy ngẫu nhiên N câu hỏi thuộc bài học này
    const questions = await Question.aggregate([
      { $match: { lessonId: lesson._id, active: true } },
      { $sample: { size: quizSize } },
      { $project: { _id: 1, text: 1, choices: 1 } },
    ]);

    if (questions.length === 0) {
      throw new Error('Ngân hàng câu hỏi của bài học này đang được cập nhật.');
    }

    return questions.map((q) => ({
      _id: q._id.toString(),
      text: q.text,
      choices: q.choices,
    }));
  }

  static async submitQuiz(
    userId: string,
    lessonId: string,
    answers: Record<string, string>
  ): Promise<QuizResultResponse> {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error('Bài học không tồn tại.');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Người dùng không tồn tại.');
    }

    const questionIds = Object.keys(answers);
    const questions = await Question.find({ _id: { $in: questionIds } });

    let score = 0;
    const details: QuizDetailedFeedback[] = [];
    const snapshots = [];

    for (const q of questions) {
      const qIdStr = q._id.toString();
      const selectedId = answers[qIdStr] || '';
      const isCorrect = q.correctIds.includes(selectedId);

      if (isCorrect) {
        score++;
      }

      const feedbackItem: QuizDetailedFeedback = {
        questionId: qIdStr,
        text: q.text,
        choices: q.choices,
        selectedId,
        isCorrect,
        correctAnswer: q.correctIds.join(', '),
        explanation: q.explanation || 'Không có giải thích chi tiết.',
      };

      details.push(feedbackItem);
      snapshots.push({
        questionId: q._id,
        text: q.text,
        choices: q.choices,
        selectedId,
        isCorrect,
        correctAnswer: feedbackItem.correctAnswer,
        explanation: feedbackItem.explanation,
      });
    }

    const passScore = lesson.passScore || 8;
    const passed = score >= passScore;

    // Lưu nhật ký lượt thi
    await QuizAttempt.create({
      userId,
      lessonId: lesson._id,
      courseId: lesson.courseId,
      questionSnapshots: snapshots,
      score,
      passed,
      submittedAt: new Date(),
    });

    // Cập nhật tiến độ bài học
    let progress = await LessonProgress.findOne({ userId, lessonId });
    if (!progress) {
      progress = new LessonProgress({
        userId,
        lessonId: lesson._id,
        courseId: lesson.courseId,
      });
    }

    progress.attemptsCount += 1;
    progress.highestScore = Math.max(progress.highestScore, score);
    if (passed) {
      progress.passed = true;
      progress.passedAt = new Date();
      progress.status = 'PASSED';
    } else if (!progress.passed) {
      progress.status = 'FAILED';
    }
    await progress.save();

    // Kiểm tra xem tất cả các bài trong khóa học đã ĐẠT hay chưa
    const allCourseLessons = await Lesson.find({ courseId: lesson.courseId, active: true });
    const passedProgresses = await LessonProgress.find({
      userId,
      courseId: lesson.courseId,
      passed: true,
    });

    if (passedProgresses.length >= allCourseLessons.length) {
      await Enrollment.findOneAndUpdate(
        { userId, courseId: lesson.courseId },
        {
          allPassed: true,
          completedAt: new Date(),
          completedLessons: passedProgresses.map((p) => p.lessonId),
        },
        { upsert: true }
      );
    }

    // Phát tín hiệu Real-time sang Admin Dashboard
    sseService.broadcastQuizResult({
      studentId: user._id.toString(),
      studentName: user.nameRaw,
      mssv: user.mssv,
      lessonTitle: lesson.title,
      score,
      passed,
      timestamp: new Date(),
    });

    return {
      score,
      passed,
      highestScore: progress.highestScore,
      attemptsCount: progress.attemptsCount,
      details,
    };
  }
}
