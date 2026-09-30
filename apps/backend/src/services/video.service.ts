import { Lesson } from '../models/Lesson.model.js';
import { LessonProgress } from '../models/LessonProgress.model.js';
import { VideoHeartbeatInput } from '@elearning/shared';

export class VideoService {
  static async recordHeartbeat(
    userId: string,
    lessonId: string,
    input: VideoHeartbeatInput
  ) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error('Bài học không tồn tại.');
    }

    const duration = lesson.videoDurationSeconds > 0 ? lesson.videoDurationSeconds : 900; // Mặc định 15p nếu chưa đặt
    const totalBlocks = Math.max(1, Math.ceil(duration / 5)); // Chia khối 5 giây

    let progress = await LessonProgress.findOne({ userId, lessonId });
    if (!progress) {
      progress = await LessonProgress.create({
        userId,
        lessonId,
        courseId: lesson.courseId,
        coveredBlocks: [],
        coveragePercent: 0,
        status: 'WATCHING',
      });
    }

    if (input.playing && input.playbackRate <= 1.05) {
      // Chỉ cộng block khi video đang phát và tốc độ không vượt quá 1x
      const currentSecond = Math.max(0, input.currentTime);
      const startSecond = Math.max(0, currentSecond - 16); // Khoảng thời gian heartbeat vừa qua (~15s)
      
      const startBlock = Math.floor(startSecond / 5);
      const endBlock = Math.min(totalBlocks - 1, Math.floor(currentSecond / 5));

      const existingSet = new Set(progress.coveredBlocks);
      for (let b = startBlock; b <= endBlock; b++) {
        existingSet.add(b);
      }

      progress.coveredBlocks = Array.from(existingSet);
      progress.coveragePercent = Math.min(1.0, progress.coveredBlocks.length / totalBlocks);

      // Kiểm tra đạt điều kiện xem video
      if (progress.coveragePercent >= lesson.minCoveragePercent) {
        progress.videoCompleted = true;
        if (progress.status === 'NOT_STARTED' || progress.status === 'WATCHING') {
          progress.status = 'QUIZ_UNLOCKED';
        }
      } else if (progress.status === 'NOT_STARTED') {
        progress.status = 'WATCHING';
      }

      await progress.save();
    }

    return {
      ok: true,
      coveragePercent: Math.round(progress.coveragePercent * 100),
      videoCompleted: progress.videoCompleted,
      quizUnlocked: progress.status !== 'NOT_STARTED' && progress.status !== 'WATCHING',
    };
  }
}
