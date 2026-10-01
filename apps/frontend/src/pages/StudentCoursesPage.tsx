import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { IStudentCourseWithProgress } from '@elearning/shared';
import { ArrowRight, ShieldCheck, Clock, ArrowLeft, CheckCircle2, BookOpen, Award } from 'lucide-react';

export const StudentCoursesPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<IStudentCourseWithProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchCourses = async () => {
      try {
        const res = await apiRequest<IStudentCourseWithProgress[]>('/api/student/courses');
        if (res.success && res.data) {
          setCourses(res.data);
        }
      } catch (err) {
        console.error('Lỗi tải khóa học:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Nút quay lại Trang chủ */}
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

      <div className="mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Học Phần Của Bạn
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Chọn học phần để tiếp tục xem bài giảng và hoàn thành các bài trắc nghiệm.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
          <p className="text-slate-500 text-sm">Đang tải danh sách học phần...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <p className="text-slate-500">Chưa có học phần nào được mở cho tài khoản của bạn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => {
            const isCompleted = course.allPassed;
            const progress = course.progressPercent || 0;

            return (
              <div
                key={course._id}
                className={`bg-white rounded-3xl border shadow-sm p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-all ${
                  isCompleted ? 'border-emerald-200 bg-gradient-to-b from-emerald-50/20 to-white' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                      {course.code}
                    </span>

                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ĐÃ HOÀN THÀNH MÔN
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Mở liên tục
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 mb-2 leading-snug">
                    {course.title}
                  </h2>
                  <p className="text-slate-600 text-sm mb-5 leading-relaxed line-clamp-2">
                    {course.description || 'Học phần lý thuyết Giáo dục Quốc phòng và An ninh theo chương trình chuẩn.'}
                  </p>

                  {/* Thanh tiến độ học tập */}
                  <div className="mb-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        Tiến độ hoàn thành:
                      </span>
                      <span className={isCompleted ? 'text-emerald-700 font-bold' : 'text-blue-700'}>
                        {course.passedLessonsCount || 0}/{course.totalLessons || 0} bài đạt ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    {isCompleted ? (
                      <Award className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                    )}
                    {course.totalLessons || 0} bài học
                  </span>

                  <Link
                    to={`/courses/${course._id}/learn`}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-700 hover:bg-emerald-800'
                        : 'bg-blue-700 hover:bg-blue-800'
                    }`}
                  >
                    <span>{isCompleted ? 'Xem lại bài học' : 'Vào học ngay'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
