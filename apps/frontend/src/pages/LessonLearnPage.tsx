import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { VideoPlayer } from '../components/VideoPlayer.js';
import { QuizView } from '../components/QuizView.js';
import {
  CheckCircle2,
  XCircle,
  PlayCircle,
  FileQuestion,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react';

interface LessonWithProgress {
  _id: string;
  courseId: string;
  title: string;
  order: number;
  videoKey?: string;
  videoDurationSeconds: number;
  minCoveragePercent: number;
  passScore: number;
  progress: {
    status: 'NOT_STARTED' | 'WATCHING' | 'QUIZ_UNLOCKED' | 'PASSED' | 'FAILED';
    coveragePercent: number;
    videoCompleted: boolean;
    passed: boolean;
    highestScore: number;
    attemptsCount: number;
  };
}

export const LessonLearnPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'quiz'>('video');
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const fetchLessons = async (keepActive = true) => {
    try {
      const res = await apiRequest<LessonWithProgress[]>(
        `/api/student/courses/${courseId}/lessons`
      );
      if (res.success && res.data && res.data.length > 0) {
        setLessons(res.data);
        if (!keepActive || !activeLessonId) {
          setActiveLessonId(res.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách bài học:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons(false);
  }, [courseId]);

  const activeLesson = lessons.find((l) => l._id === activeLessonId) || lessons[0];

  const handleVideoCompleted = () => {
    // Cập nhật trạng thái bài học hiện tại trong danh sách
    setLessons((prev) =>
      prev.map((l) =>
        l._id === activeLesson?._id
          ? {
              ...l,
              progress: {
                ...l.progress,
                videoCompleted: true,
                status: l.progress.status === 'NOT_STARTED' || l.progress.status === 'WATCHING' ? 'QUIZ_UNLOCKED' : l.progress.status,
              },
            }
          : l
      )
    );
  };

  const handleQuizSuccess = () => {
    fetchLessons(true);
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
        <p className="text-slate-500 text-sm">Đang tải nội dung học tập...</p>
      </div>
    );
  }

  if (!activeLesson) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <p className="text-slate-600 mb-4">Học phần này hiện chưa có bài giảng nào.</p>
        <Link to="/courses" className="text-blue-600 font-semibold hover:underline">
          ← Quay lại danh sách học phần
        </Link>
      </div>
    );
  }

  const isQuizUnlocked =
    activeLesson.progress.videoCompleted ||
    activeLesson.progress.status === 'QUIZ_UNLOCKED' ||
    activeLesson.progress.status === 'PASSED' ||
    activeLesson.progress.status === 'FAILED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Nút quay lại danh sách học phần */}
      <div className="mb-4">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-xs hover:border-slate-300 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại danh sách học phần</span>
        </Link>
      </div>

      {/* Breadcrumb & Tiêu đề bài học */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/courses" className="hover:text-blue-600">
              Khóa học
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-medium">Học phần GDQP&AN</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
            Bài {activeLesson.order}: {activeLesson.title}
          </h1>
        </div>

        {/* Nút bật tắt Sidebar trên Mobile */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Bố cục 2 cột phong cách Khan Academy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI / TRUNG TÂM: Khung xem Video hoặc Khung làm bài Quiz (8 cột) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Thanh chuyển đổi chế độ Học Video <-> Làm Bài Thi */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'video'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlayCircle className="w-4 h-4 text-blue-600" />
              <span>1. Xem Bài Giảng</span>
            </button>

            <button
              onClick={() => {
                if (isQuizUnlocked) {
                  setActiveTab('quiz');
                } else {
                  alert('Bạn cần xem tối thiểu 95% thời lượng video bài giảng để mở khóa bài kiểm tra.');
                }
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'quiz'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : isQuizUnlocked
                  ? 'text-slate-700 hover:text-slate-900 cursor-pointer'
                  : 'text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <FileQuestion className="w-4 h-4 text-emerald-600" />
              <span>2. Bài Kiểm Tra</span>
              {activeLesson.progress.passed ? (
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  {activeLesson.progress.highestScore}/10 ĐẠT ✅
                </span>
              ) : isQuizUnlocked ? (
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                  Sẵn sàng
                </span>
              ) : (
                <span className="text-xs text-slate-400">🔒 Khóa</span>
              )}
            </button>
          </div>

          {/* Nội dung chính tương ứng với Tab */}
          {activeTab === 'video' ? (
            <div className="space-y-6">
              <VideoPlayer
                key={activeLesson._id}
                lessonId={activeLesson._id}
                videoUrl={activeLesson.videoKey}
                minCoveragePercent={Math.round(activeLesson.minCoveragePercent * 100)}
                initialCoveragePercent={activeLesson.progress.coveragePercent}
                initialVideoCompleted={activeLesson.progress.videoCompleted}
                onVideoCompleted={handleVideoCompleted}
              />

              {/* Box hành động dưới Video */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Trạng thái bài học:</h3>
                  <p className="text-slate-600 text-sm mt-0.5">
                    {activeLesson.progress.passed ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Bạn đã đạt bài học này ({activeLesson.progress.highestScore}/10 điểm).
                      </span>
                    ) : isQuizUnlocked ? (
                      <span className="text-amber-700 font-semibold">
                        Bạn đã xem đủ thời lượng video! Hãy làm bài kiểm tra để hoàn thành bài.
                      </span>
                    ) : (
                      <span>Vui lòng xem bài giảng và không tua lướt để mở bài kiểm tra.</span>
                    )}
                  </p>
                </div>

                {isQuizUnlocked && (
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex-shrink-0"
                  >
                    <span>Làm bài kiểm tra ngay</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <QuizView
              lessonId={activeLesson._id}
              lessonTitle={activeLesson.title}
              passScore={activeLesson.passScore}
              onSuccess={handleQuizSuccess}
              onBackToVideo={() => setActiveTab('video')}
            />
          )}
        </div>

        {/* CỘT PHẢI: Danh sách các bài giảng (Sidebar Khan Academy) (4 cột) */}
        <div
          className={`lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 ${
            sidebarOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-base">Danh Sách Bài Học</h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
              {lessons.filter((l) => l.progress.passed).length}/{lessons.length} bài đạt
            </span>
          </div>

          <div className="space-y-2.5">
            {lessons.map((lesson) => {
              const isActive = lesson._id === activeLesson._id;
              const { passed, highestScore, status, coveragePercent } = lesson.progress;

              return (
                <div
                  key={lesson._id}
                  onClick={() => {
                    setActiveLessonId(lesson._id);
                    setActiveTab('video');
                    setSidebarOpen(false);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isActive
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isActive ? 'text-blue-700' : 'text-slate-500'
                      }`}
                    >
                      Bài {lesson.order}
                    </span>

                    {/* Badge trạng thái */}
                    {passed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> ĐẠT ({highestScore}/10)
                      </span>
                    ) : status === 'FAILED' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Chưa đạt ({highestScore}/10)
                      </span>
                    ) : status === 'QUIZ_UNLOCKED' ? (
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Sẵn sàng thi
                      </span>
                    ) : status === 'WATCHING' ? (
                      <span className="text-xs font-medium text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-full">
                        Đang xem {coveragePercent}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        Chưa học
                      </span>
                    )}
                  </div>

                  <h3
                    className={`text-sm font-semibold leading-snug line-clamp-2 ${
                      isActive ? 'text-slate-900 font-bold' : 'text-slate-700'
                    }`}
                  >
                    {lesson.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
