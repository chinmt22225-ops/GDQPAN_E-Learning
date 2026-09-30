import { IChoice } from './question.types.js';

export interface IQuestionSnapshot {
  questionId: string;
  text: string;
  choices: IChoice[];
  selectedId?: string;
  isCorrect?: boolean;
  correctAnswer?: string;
  explanation?: string;
}

export interface IQuizAttempt {
  _id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  questionSnapshots: IQuestionSnapshot[];
  score: number;
  passed: boolean;
  submittedAt: string | Date;
}

export interface QuizSubmitPayload {
  answers: Record<string, string>; // { questionId: selectedChoiceId }
}

export interface QuizDetailedFeedback {
  questionId: string;
  text: string;
  choices: IChoice[];
  selectedId: string;
  isCorrect: boolean;
  correctAnswer?: string;
  explanation?: string;
}

export interface QuizResultResponse {
  score: number;
  passed: boolean;
  highestScore: number;
  attemptsCount: number;
  details: QuizDetailedFeedback[];
}
