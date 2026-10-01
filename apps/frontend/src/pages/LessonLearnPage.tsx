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
  ChevronLeft,
  Menu,
  X,
  ArrowLeft,
  Sparkles,
  Trophy,
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
  const [videoFinishedNotice, setVideoFinishedNotice] = useState<boolean>(false);

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
  const currentIndex = lessons.findIndex((l) => l._id === (activeLesson?._id || ''));
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const passedLessonsCount = lessons.filter((l) => l.progress.passed).length;
  const courseProgressPercent = lessons.length > 0 ? Math.round((passedLessonsCount / lessons.length) * 100) : 0;
  const isCourseAllPassed = lessons.length > 0 && passedLessonsCount === lessons.length;

  const handleVideoCompleted = () => {
    setVideoFinishedNotice(true);
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

  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setActiveTab('video');
    setVideoFinishedNotice(false);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Nút quay lại & Thanh tiến độ toàn khóa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-xs hover:border-slate-300 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Quay lại danh sách học phần</span>
          </Link>
        </div>

        {/* Thanh tiến độ khóa học tóm tắt */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Tiến độ học phần</span>
            <span className="text-xs font-bold text-slate-800">
              {passedLessonsCount}/{lessons.length} bài đạt ({courseProgressPercent}%)
            </span>
          </div>
          <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${isCourseAllPassed ? 'bg-emerald-600' : 'bg-blue-600'}`}
              style={{ width: `${courseProgressPercent}%` }}
            />
          </div>
          {isCourseAllPassed && (
            <span className="p-1 rounded-full bg-emerald-100 text-emerald-700" title="Đã hoàn thành môn học!">
              <Trophy className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>

      {/* Banner chúc mừng nếu đã hoàn thành toàn bộ bài học */}
      {isCourseAllPassed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                XIN CHÚC MỪNG! BẠN ĐÃ HOÀN THÀNH TOÀN BỘ HỌC PHẦN
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Bạn đã đạt tất cả {lessons.length} bài học. Bạn vẫn có thể xem lại video hoặc thi lại từng bài để nâng điểm.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb & Tiêu đề bài học */}
      <div className="flex items-center justify-between gap-4">
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
          className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm text-xs font-bold cursor-pointer"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>{sidebarOpen ? 'Đóng mục lục' : 'Mục lục bài học'}</span>
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
              {/* Thông báo chúc mừng khi hoàn thành video */}
              {videoFinishedNotice && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-xl flex-shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">
                        Chúc mừng bạn đã xem đủ video bài giảng!
                      </h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Tỷ lệ xem đạt yêu cầu (≥ 95%). Đề thi trắc nghiệm đã được mở khóa. Hãy làm bài ngay để ghi nhận điểm.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('quiz');
                      setVideoFinishedNotice(false);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex-shrink-0 cursor-pointer"
                  >
                    <span>Làm bài kiểm tra ngay</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <VideoPlayer
                key={activeLesson._id}
                lessonId={activeLesson._id}
                videoUrl={activeLesson.videoKey}
                minCoveragePercent={Math.round(activeLesson.minCoveragePercent * 100)}
                initialCoveragePercent={activeLesson.progress.videoCompleted ? 100 : 0}
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
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex-shrink-0 cursor-pointer"
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

          {/* Thanh điều hướng Chuyển bài học (Prev / Next) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
            {prevLesson ? (
              <button
                onClick={() => handleSelectLesson(prevLesson._id)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Bài trước:</span> Bài {prevLesson.order}
              </button>
            ) : (
              <div />
            )}

            {nextLesson ? (
              <button
                onClick={() => handleSelectLesson(nextLesson._id)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>Bài tiếp theo: Bài {nextLesson.order}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
              >
                <span>Xem danh sách học phần</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: Danh sách các bài giảng (Sidebar Khan Academy) (4 cột) */}
        <div
          className={`lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 ${
            sidebarOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Nội Dung Khóa Học</h2>
              <span className="text-xs text-slate-500">Chuẩn chương trình GDQP&AN</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
              {passedLessonsCount}/{lessons.length} bài đạt
            </span>
          </div>

          {/* Mini Progress Bar trong Sidebar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${isCourseAllPassed ? 'bg-emerald-600' : 'bg-blue-600'}`}
              style={{ width: `${courseProgressPercent}%` }}
            />
          </div>

          <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {lessons.map((lesson) => {
              const isActive = lesson._id === activeLesson._id;
              const { passed, highestScore, status, coveragePercent } = lesson.progress;

              return (
                <div
                  key={lesson._id}
                  onClick={() => handleSelectLesson(lesson._id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isActive
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
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
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> ĐẠT ({highestScore}/10)
                      </span>
                    ) : status === 'FAILED' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Chưa đạt ({highestScore}/10)
                      </span>
                    ) : status === 'QUIZ_UNLOCKED' ? (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Sẵn sàng thi
                      </span>
                    ) : status === 'WATCHING' ? (
                      <span className="text-[11px] font-medium text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-full">
                        Đang xem {coveragePercent}%
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        Chưa học
                      </span>
                    )}
                  </div>

                  <h3
                    className={`text-xs sm:text-sm font-semibold leading-snug line-clamp-2 ${
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
