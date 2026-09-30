export type LessonProgressStatus = 
  | 'NOT_STARTED'
  | 'WATCHING'
  | 'QUIZ_UNLOCKED'
  | 'PASSED'
  | 'FAILED';

export interface ILesson {
  _id: string;
  courseId: string;
  title: string;
  order: number;
  videoKey?: string;
  videoDurationSeconds: number;
  minCoveragePercent: number;
  passScore: number;
  totalQuestionsPerQuiz: number;
  active: boolean;
}

export interface ILessonProgress {
  _id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  coveredBlocks: number[];
  coveragePercent: number;
  videoCompleted: boolean;
  highestScore: number;
  attemptsCount: number;
  passed: boolean;
  passedAt?: string | Date;
  status: LessonProgressStatus;
  updatedAt: string | Date;
}

export interface VideoHeartbeatPayload {
  currentTime: number;
  playing: boolean;
  playbackRate: number;
}

export interface VideoHeartbeatResponse {
  ok: boolean;
  coveragePercent: number;
  videoCompleted: boolean;
  quizUnlocked: boolean;
}
