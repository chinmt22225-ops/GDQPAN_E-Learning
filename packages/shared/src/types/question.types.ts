export interface IChoice {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface IQuestion {
  _id: string;
  lessonId: string;
  courseId: string;
  text: string;
  choices: IChoice[];
  correctIds: string[];
  explanation?: string;
  active: boolean;
}

// Dạng câu hỏi gửi xuống client khi làm bài (KHÔNG có correctIds hay explanation)
export interface IQuizQuestionForStudent {
  _id: string;
  text: string;
  choices: IChoice[];
}
