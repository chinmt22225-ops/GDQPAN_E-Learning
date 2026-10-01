import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import {
  Users,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Award,
  Activity,
  TrendingUp,
  ArrowLeft,
  BookOpen,
  Volume2,
  VolumeX,
  Trash2,
  BarChart3,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface LessonStatItem {
  lessonId: string;
  title: string;
  order: number;
  courseCode: string;
  courseTitle: string;
  passedCount: number;
  totalAttempts: number;
  passRate: number;
  avgScore: number;
}

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalPassedStudents: number;
  passRate: number;
  totalAttempts: number;
  lessonStats?: LessonStatItem[];
}

interface LiveQuizEvent {
  studentId: string;
  studentName: string;
  mssv: string;
  lessonTitle: string;
  score: number;
  passed: boolean;
  timestamp: string;
}

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [liveEvents, setLiveEvents] = useState<LiveQuizEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [eventFilter, setEventFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const soundEnabledRef = useRef<boolean>(soundEnabled);

  soundEnabledRef.current = soundEnabled;

  const playChime = (passed: boolean) => {
    if (!soundEnabledRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(passed ? 587.33 : 329.63, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(passed ? 880 : 220, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio playback requires user interaction
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiRequest<DashboardStats>('/api/admin/dashboard');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải thống kê admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Kết nối luồng Server-Sent Events (SSE) để nhận sự kiện nộp bài real-time
    const eventSource = new EventSource('/api/admin/events');

    eventSource.onopen = () => {
      setSseConnected(true);
    };

    eventSource.onerror = () => {
      setSseConnected(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'QUIZ_SUBMITTED' && payload.data) {
          const newEvt: LiveQuizEvent = payload.data;
          setLiveEvents((prev) => [newEvt, ...prev.slice(0, 29)]); // Giữ 30 sự kiện gần nhất
          playChime(newEvt.passed);
          fetchStats(); // Cập nhật lại số liệu thống kê
        }
      } catch {
        // ignore parse error
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const filteredEvents = liveEvents.filter((evt) => {
    if (eventFilter === 'passed') return evt.passed;
    if (eventFilter === 'failed') return !evt.passed;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Nút quay lại trang trước */}
      <div>
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-xs hover:border-slate-300 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại trang trước</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Bảng Quản Trị & Giám Sát Thời Gian Thực
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Theo dõi tiến độ học tập và kết quả khảo thí lý thuyết GDQP&AN trực tiếp qua luồng dữ liệu thời gian thực.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/courses"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Khóa học & Đề thi</span>
          </Link>
          <Link
            to="/admin/students"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Quản lý Sinh viên</span>
          </Link>
          <a
            href="/api/admin/export.xlsx"
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel Bảng Điểm</span>
          </a>
        </div>
      </div>

      {/* 4 Thẻ Thống kê chỉ số */}
      {loading && !stats ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
          <p className="text-slate-500 text-sm">Đang tải số liệu thống kê...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tổng Sinh Viên
              </span>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <span className="text-3xl font-black text-slate-900 block mb-1">
              {stats ? stats.totalStudents.toLocaleString() : '...'}
            </span>
            <span className="text-xs text-slate-500">
              {stats ? `${stats.activeStudents} đã kích hoạt tài khoản` : 'Đang tải...'}
            </span>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Hoàn Thành Môn (ĐẠT)
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <span className="text-3xl font-black text-emerald-600 block mb-1">
              {stats ? stats.totalPassedStudents.toLocaleString() : '...'}
            </span>
            <span className="text-xs text-slate-500">Đã đạt tất cả bài học bắt buộc</span>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-purple-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tỷ Lệ Đạt Môn
              </span>
              <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <span className="text-3xl font-black text-purple-700 block mb-1">
              {stats ? `${stats.passRate}%` : '...'}
            </span>
            <span className="text-xs text-slate-500">Tỷ lệ sinh viên hoàn thành toàn khóa</span>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Lượt Thi Đã Nộp
              </span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <span className="text-3xl font-black text-amber-700 block mb-1">
              {stats ? stats.totalAttempts.toLocaleString() : '...'}
            </span>
            <span className="text-xs text-slate-500">Bao gồm cả các lượt thi lại nâng điểm</span>
          </div>
        </div>
      )}

      {/* Bảng Sự Kiện Trực Tiếp Real-Time (SSE) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3.5 w-3.5">
              {sseConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                </>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Giám Sát Kết Quả Nộp Bài Trực Tiếp (SSE)
              </h2>
              <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                {sseConnected ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5" /> Luồng SSE đang kết nối ổn định
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    <WifiOff className="w-3.5 h-3.5" /> Đang thiết lập lại kết nối tới server...
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Công cụ điều khiển: Bộ lọc, Âm thanh, Xóa danh sách */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Bộ lọc */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setEventFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  eventFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Tất cả ({liveEvents.length})
              </button>
              <button
                onClick={() => setEventFilter('passed')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  eventFilter === 'passed' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Đạt ({liveEvents.filter((e) => e.passed).length})
              </button>
              <button
                onClick={() => setEventFilter('failed')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  eventFilter === 'failed' ? 'bg-white text-red-700 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Chưa đạt ({liveEvents.filter((e) => !e.passed).length})
              </button>
            </div>

            {/* Bật/Tắt chuông */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Tắt âm báo khi có kết quả mới' : 'Bật âm báo khi có kết quả mới'}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Xóa log */}
            {liveEvents.length > 0 && (
              <button
                onClick={() => setLiveEvents([])}
                title="Làm sạch danh sách sự kiện"
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
            <p className="text-slate-600 font-medium text-sm">Chưa có lượt nộp bài nào gần đây.</p>
            <p className="text-slate-400 text-xs mt-1">
              Khi sinh viên bấm nộp bài kiểm tra, kết quả với dấu tick xanh/đỏ sẽ nhấp nháy tại đây ngay lập tức.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {filteredEvents.map((evt, idx) => (
              <div
                key={`${evt.studentId}_${evt.timestamp}_${idx}`}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-300 animate-fadeIn ${
                  evt.passed ? 'bg-emerald-50/70 border-emerald-200' : 'bg-red-50/70 border-red-200'
                } ${idx === 0 ? 'ring-2 ring-blue-400/40 shadow-xs' : ''}`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-2 rounded-xl flex-shrink-0 ${
                      evt.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {evt.passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{evt.studentName}</span>
                      <span className="text-xs font-mono px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-md">
                        {evt.mssv}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 mt-0.5 block">{evt.lessonTitle}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span
                      className={`text-base font-black ${
                        evt.passed ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {evt.score}/10 {evt.passed ? 'ĐẠT ✅' : 'CHƯA ĐẠT ❌'}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bảng Thống Kê Tiến Độ Từng Bài Học (Khan Academy Style Analytics) */}
      {stats?.lessonStats && stats.lessonStats.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Tiến Độ & Tỷ Lệ Đạt Từng Bài Học
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bảng phân tích tỷ lệ hoàn thành và chất lượng làm bài của sinh viên theo từng bài giảng.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {stats.lessonStats.length} bài học
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-500 bg-slate-50/50">
                  <th className="py-3 px-4 rounded-l-xl">Bài học</th>
                  <th className="py-3 px-4">Học phần</th>
                  <th className="py-3 px-4 text-center">Sinh viên Đạt</th>
                  <th className="py-3 px-4">Tỷ lệ đạt</th>
                  <th className="py-3 px-4 text-center">Điểm TB</th>
                  <th className="py-3 px-4 text-center rounded-r-xl">Tổng lượt thi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.lessonStats.map((item) => (
                  <tr key={item.lessonId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-sm">
                        Bài {item.order}: {item.title}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold">
                        {item.courseCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-slate-800">
                        {item.passedCount}
                      </span>
                      <span className="text-xs text-slate-400">/{stats.totalStudents}</span>
                    </td>
                    <td className="py-3.5 px-4 min-w-44">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>{item.passRate}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              item.passRate >= 70 ? 'bg-emerald-600' : item.passRate >= 40 ? 'bg-blue-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${item.passRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {item.avgScore}/10
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 text-xs font-mono">
                      {item.totalAttempts.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
