import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { ICourse } from '@elearning/shared';
import { ArrowRight, ShieldCheck, Clock } from 'lucide-react';

export const StudentCoursesPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<ICourse[]>([]);
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
        const res = await apiRequest<ICourse[]>('/api/student/courses');
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
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
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
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                    {course.code}
                  </span>
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Mở liên tục
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-2 leading-snug">
                  {course.title}
                </h2>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  {course.description || 'Học phần lý thuyết Giáo dục Quốc phòng và An ninh theo chương trình chuẩn.'}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Thi theo từng bài
                </span>

                <Link
                  to={`/courses/${course._id}/learn`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
                >
                  <span>Vào học ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
