import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalPassedStudents: number;
  passRate: number;
  totalAttempts: number;
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

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'QUIZ_SUBMITTED' && payload.data) {
          setLiveEvents((prev) => [payload.data, ...prev.slice(0, 19)]); // Giữ 20 sự kiện gần nhất
          fetchStats(); // Cập nhật lại số liệu thống kê
        }
      } catch (err) {
        // ignore parse error
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
            Theo dõi tiến độ học tập và kết quả khảo thí lý thuyết GDQP&AN trực tiếp.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
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

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
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

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
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
          <span className="text-xs text-slate-500">Tỷ lệ hoàn thành toàn khóa</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
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
          <span className="text-xs text-slate-500">Bao gồm cả các lần thi lại</span>
        </div>
      </div>
      )}

      {/* Bảng Sự Kiện Trực Tiếp Real-Time (SSE) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Bảng Theo Dõi Nộp Bài Thời Gian Thực
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Đang lắng nghe kết quả...</span>
        </div>

        {liveEvents.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
            <p className="text-slate-600 font-medium text-sm">Chưa có lượt nộp bài nào gần đây.</p>
            <p className="text-slate-400 text-xs mt-1">
              Khi sinh viên bấm nộp bài kiểm tra, kết quả với dấu tick xanh/đỏ sẽ nhấp nháy tại đây ngay lập tức.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {liveEvents.map((evt, idx) => (
              <div
                key={`${evt.studentId}_${idx}`}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-300 animate-fadeIn ${
                  evt.passed ? 'bg-emerald-50/60 border-emerald-200' : 'bg-red-50/60 border-red-200'
                }`}
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
    </div>
  );
};
