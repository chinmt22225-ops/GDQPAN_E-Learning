export interface ICourse {
  _id: string;
  code: string;
  title: string;
  description?: string;
  coverImageKey?: string;
  totalLessons: number;
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IEnrollment {
  _id: string;
  userId: string;
  courseId: string;
  completedLessons: string[];
  allPassed: boolean;
  completedAt?: string | Date;
  updatedAt: string | Date;
}

export interface IStudentCourseWithProgress extends ICourse {
  passedLessonsCount: number;
  allPassed: boolean;
  progressPercent: number;
  completedAt?: string | Date;
}

