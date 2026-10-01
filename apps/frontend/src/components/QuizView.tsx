import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../api/client.js';
import { IQuizQuestionForStudent, QuizResultResponse } from '@elearning/shared';
import { CheckCircle2, XCircle, RotateCcw, Award, AlertCircle, ArrowRight, Clock } from 'lucide-react';

interface QuizViewProps {
  lessonId: string;
  lessonTitle: string;
  passScore?: number;
  onSuccess: () => void;
  onBackToVideo: () => void;
}

const DEFAULT_QUIZ_DURATION = 15 * 60; // 15 phút (900 giây)

export const QuizView: React.FC<QuizViewProps> = ({
  lessonId,
  lessonTitle,
  passScore = 8,
  onSuccess,
  onBackToVideo,
}) => {
  const [questions, setQuestions] = useState<IQuizQuestionForStudent[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<QuizResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_QUIZ_DURATION);
  const answersRef = useRef<Record<string, string>>({});

  // Cập nhật ref để auto-submit luôn đọc giá trị câu trả lời mới nhất
  answersRef.current = answers;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswers({});
    setTimeLeft(DEFAULT_QUIZ_DURATION);

    try {
      const res = await apiRequest<IQuizQuestionForStudent[]>(
        `/api/student/lessons/${lessonId}/quiz`
      );
      if (res.success && res.data) {
        setQuestions(res.data);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Không thể tải câu hỏi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [lessonId]);

  // Bộ đếm thời gian thi (15 phút)
  useEffect(() => {
    if (loading || result || !!error || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, result, error, questions.length]);

  const triggerAutoSubmit = async () => {
    if (submitting || result) return;
    setSubmitting(true);
    try {
      const res = await apiRequest<QuizResultResponse>(
        `/api/student/lessons/${lessonId}/quiz/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ answers: answersRef.current }),
        }
      );

      if (res.success && res.data) {
        setResult(res.data);
        if (res.data.passed) {
          onSuccess();
        }
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Đã hết thời gian làm bài.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectChoice = (questionId: string, choiceId: string) => {
    if (result) return; // Không cho sửa khi đã nộp
    setAnswers((prev) => ({
      ...prev,
      [questionId]: choiceId,
    }));
  };

  const handleSubmit = async () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      alert(`Bạn mới trả lời ${answeredCount}/${questions.length} câu. Vui lòng hoàn thành tất cả các câu trước khi nộp.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest<QuizResultResponse>(
        `/api/student/lessons/${lessonId}/quiz/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ answers }),
        }
      );

      if (res.success && res.data) {
        setResult(res.data);
        if (res.data.passed) {
          onSuccess();
        }
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Lỗi khi nộp bài.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-slate-600 font-medium">Đang bốc 10 câu hỏi ngẫu nhiên từ ngân hàng đề...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-red-200 shadow-sm">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Chưa thể làm bài kiểm tra</h3>
        <p className="text-slate-600 text-sm mb-6">{error}</p>
        <button
          onClick={onBackToVideo}
          className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900"
        >
          ← Quay lại xem bài giảng
        </button>
      </div>
    );
  }

  // MÀN HÌNH HIỂN THỊ KẾT QUẢ SAU KHI NỘP BÀI
  if (result) {
    return (
      <div className="space-y-6">
        {/* Banner Tổng kết điểm */}
        <div
          className={`rounded-2xl p-6 sm:p-8 text-center border shadow-sm ${
            result.passed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-red-50 border-red-200 text-red-950'
          }`}
        >
          <div className="inline-flex p-3 rounded-full mb-3 bg-white shadow-sm">
            {result.passed ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {result.passed ? 'XIN CHÚC MỪNG! BẠN ĐÃ ĐẠT YÊU CẦU' : 'CHƯA ĐẠT YÊU CẦU'}
          </h2>
          <p className="text-base font-medium opacity-90 max-w-lg mx-auto mb-4">
            {result.passed
              ? `Bạn đã xuất sắc hoàn thành nội dung bài học "${lessonTitle}".`
              : `Để hoàn thành bài học, bạn cần đạt tối thiểu ${passScore}/10 điểm. Hãy xem lại các câu làm sai bên dưới và thi lại ngay.`}
          </p>

          <div className="inline-flex items-center gap-6 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200/80 mb-6">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold block">Điểm lần này</span>
              <span
                className={`text-2xl font-black ${
                  result.passed ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {result.score}/10
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold block">Điểm cao nhất</span>
              <span className="text-2xl font-black text-blue-700">{result.highestScore}/10</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold block">Số lần làm</span>
              <span className="text-2xl font-black text-slate-700">{result.attemptsCount}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={loadQuestions}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Làm lại bài kiểm tra (Đề mới)
            </button>
            <button
              onClick={onBackToVideo}
              className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold transition-all"
            >
              ← Quay lại bài giảng
            </button>
          </div>
        </div>

        {/* Danh sách chi tiết câu hỏi & Lời giải thích câu sai */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Chi tiết bài thi & Giải thích đáp án
          </h3>

          <div className="space-y-6">
            {result.details.map((detail, idx) => (
              <div
                key={detail.questionId}
                className={`p-5 rounded-2xl border transition-all ${
                  detail.isCorrect
                    ? 'bg-slate-50/70 border-emerald-200'
                    : 'bg-red-50/40 border-red-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    Câu {idx + 1}. {detail.text}
                  </span>
                  {detail.isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full flex-shrink-0">
                      <XCircle className="w-3.5 h-3.5" /> Sai
                    </span>
                  )}
                </div>

                {/* Các lựa chọn */}
                <div className="space-y-2 mb-3">
                  {detail.choices.map((c) => {
                    const isSelected = detail.selectedId === c.id;
                    const isTheCorrect = detail.correctAnswer?.includes(c.id);

                    let choiceClass = 'border-slate-200 bg-white text-slate-700';
                    if (isSelected && detail.isCorrect) {
                      choiceClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold';
                    } else if (isSelected && !detail.isCorrect) {
                      choiceClass = 'border-red-400 bg-red-100 text-red-950 font-semibold';
                    } else if (!detail.isCorrect && isTheCorrect) {
                      choiceClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                    }

                    return (
                      <div
                        key={c.id}
                        className={`px-4 py-2.5 rounded-xl border text-sm flex items-center justify-between ${choiceClass}`}
                      >
                        <span>
                          <strong className="mr-2">{c.id}.</strong>
                          {c.text}
                        </span>
                        {isSelected && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            Bạn đã chọn
                          </span>
                        )}
                        {!detail.isCorrect && isTheCorrect && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-800">
                            Đáp án đúng
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Lời giải thích nếu làm sai */}
                {!detail.isCorrect && detail.explanation && (
                  <div className="mt-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-900">
                    <span className="font-bold block mb-1">💡 Lời giải thích:</span>
                    <span>{detail.explanation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // MÀN HÌNH LÀM BÀI TRẮC NGHIỆM (10 CÂU HỎI)
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      {/* Header làm bài */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bài Kiểm Tra Trắc Nghiệm</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {lessonTitle} • Yêu cầu đạt: <strong>≥ {passScore}/10 điểm</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Bộ đếm thời gian thi (15:00) */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-bold shadow-xs transition-colors ${
              timeLeft <= 120
                ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                : timeLeft <= 300
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
            title="Thời gian làm bài còn lại"
          >
            <Clock className={`w-4 h-4 ${timeLeft <= 120 ? 'text-red-600' : 'text-blue-600'}`} />
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Tiến độ</span>
            <span className="text-sm font-bold text-blue-700">
              {answeredCount}/{questions.length} câu
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount < questions.length}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              answeredCount === questions.length
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Đang chấm...' : 'Nộp bài kiểm tra'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cảnh báo khi thời gian dưới 2 phút */}
      {timeLeft <= 120 && (
        <div className="p-3.5 bg-red-50 border border-red-300 rounded-2xl text-xs sm:text-sm text-red-900 font-semibold flex items-center justify-between animate-pulse">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            Thời gian làm bài sắp hết! Hệ thống sẽ tự động thu bài khi đồng hồ về 00:00.
          </span>
          <span className="font-mono font-bold text-red-700 bg-white px-2 py-0.5 rounded-lg border border-red-200">
            {formatTime(timeLeft)}
          </span>
        </div>
      )}

      {/* Danh sách 10 câu hỏi */}
      <div className="space-y-5">
        {questions.map((q, idx) => (
          <div
            key={q._id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-sm flex-shrink-0">
                {idx + 1}
              </span>
              <p className="font-semibold text-slate-900 text-base leading-relaxed">{q.text}</p>
            </div>

            {/* Danh sách đáp án A, B, C, D */}
            <div className="space-y-2.5 ml-1 sm:ml-10">
              {q.choices.map((choice) => {
                const isSelected = answers[q._id] === choice.id;
                return (
                  <label
                    key={choice.id}
                    onClick={() => handleSelectChoice(q._id, choice.id)}
                    className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-medium shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q._id}
                      value={choice.id}
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">
                      <strong className="mr-1.5">{choice.id}.</strong>
                      {choice.text}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Nút nộp bài dưới chân */}
      <div className="text-center pt-4 pb-8">
        <button
          onClick={handleSubmit}
          disabled={submitting || answeredCount < questions.length}
          className={`px-8 py-3.5 rounded-2xl text-base font-bold shadow-md transition-all ${
            answeredCount === questions.length
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer hover:shadow-lg'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Đang chấm điểm...' : `Nộp bài kiểm tra (${answeredCount}/${questions.length} câu)`}
        </button>
      </div>
    </div>
  );
};
