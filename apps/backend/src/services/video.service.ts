import { Lesson } from '../models/Lesson.model.js';
import { LessonProgress } from '../models/LessonProgress.model.js';
import { VideoHeartbeatInput } from '@elearning/shared';
import { getRedisClient } from '../config/redis.js';

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

    // Tự động đồng bộ thời lượng video từ trình phát thực tế nếu chưa chính xác
    if (input.duration && input.duration > 0) {
      const playerDur = Math.round(input.duration);
      if (!lesson.videoDurationSeconds || Math.abs(lesson.videoDurationSeconds - playerDur) > 3) {
        lesson.videoDurationSeconds = playerDur;
        await lesson.save().catch(() => {});
      }
    }

    const duration = lesson.videoDurationSeconds > 0 ? lesson.videoDurationSeconds : (input.duration ? Math.round(input.duration) : 900);
    const totalBlocks = Math.max(1, Math.ceil(duration / 5)); // Chia khối 5 giây chuẩn ADR-08

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

    // Kiểm tra tính hợp lệ qua Redis Session Cache
    const redis = getRedisClient();
    const redisKey = `heartbeat:${userId}:${lessonId}`;
    let isValidPlayback = true;

    try {
      const prevDataStr = await redis.get(redisKey);
      const now = Date.now();

      if (prevDataStr) {
        const prevData = JSON.parse(prevDataStr);
        const wallClockDiffSec = (now - prevData.timestamp) / 1000;
        const playerTimeDiffSec = input.currentTime - prevData.currentTime;

        // Nếu thời gian phát trên player nhảy vọt quá nhanh so với thời gian thực tế
        // (cho phép độ trễ mạng tối đa 3s và tua ngược thoải mái)
        if (playerTimeDiffSec > wallClockDiffSec * 1.5 + 4) {
          isValidPlayback = false;
        }
      }

      // Lưu lại mốc heartbeat hiện tại vào Redis (hạn 120 giây)
      await redis.set(
        redisKey,
        JSON.stringify({ currentTime: input.currentTime, timestamp: now }),
        'EX',
        120
      );
    } catch {
      // Nếu Redis tạm thời không phản hồi, vẫn cho phép tiếp tục chạy qua MongoDB
    }

    // Chỉ tích lũy block khi video đang phát thực sự, tốc độ <= 1.05x và không gian lận tua nhanh
    if (input.playing && input.playbackRate <= 1.05 && isValidPlayback) {
      const currentSecond = Math.max(0, input.currentTime);

      // Nếu bắt đầu xem từ đầu (0-15s) và bài học chưa hoàn thành: Làm mới lại danh sách blocks để tiến độ tính từ 0%
      if (currentSecond <= 15 && !progress.passed && !progress.videoCompleted) {
        progress.coveredBlocks = [];
      }

      const startSecond = Math.max(0, currentSecond - 16); // Khoảng 15s vừa trôi qua giữa 2 lần heartbeat

      const startBlock = Math.floor(startSecond / 5);
      const endBlock = Math.min(totalBlocks - 1, Math.floor(currentSecond / 5));

      const existingSet = new Set(progress.coveredBlocks);
      for (let b = startBlock; b <= endBlock; b++) {
        existingSet.add(b);
      }

      progress.coveredBlocks = Array.from(existingSet);
      progress.coveragePercent = Math.min(1.0, progress.coveredBlocks.length / totalBlocks);

      // Kiểm tra đạt điều kiện tối thiểu xem video (mặc định >= 95% theo ADR-08)
      if (progress.coveragePercent >= (lesson.minCoveragePercent || 0.95)) {
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
