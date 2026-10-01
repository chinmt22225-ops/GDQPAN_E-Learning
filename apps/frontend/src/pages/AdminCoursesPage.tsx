import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  FolderKanban,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
} from 'lucide-react';

interface CourseAdminItem {
  _id: string;
  code: string;
  title: string;
  description?: string;
  totalLessons: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const AdminCoursesPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<CourseAdminItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<CourseAdminItem | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    active: true,
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete State
  const [deletingCourse, setDeletingCourse] = useState<CourseAdminItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/admin/login');
    }
  }, [user, authLoading, navigate]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<CourseAdminItem[]>('/api/admin/courses');
      if (res.success && res.data) {
        setCourses(res.data);
      }
    } catch (err: unknown) {
      console.error('Lỗi tải danh sách khóa học:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCourses();
    }
  }, [user]);

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      active: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: CourseAdminItem) => {
    setEditingCourse(c);
    setFormData({
      code: c.code,
      title: c.title,
      description: c.description || '',
      active: c.active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.title.trim()) {
      setFormError('Mã học phần và tên học phần không được để trống.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingCourse) {
        // Cập nhật
        const res = await apiRequest(`/api/admin/courses/${editingCourse._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        if (res.success) {
          setIsModalOpen(false);
          fetchCourses();
        } else {
          setFormError(res.message || 'Không thể cập nhật khóa học.');
        }
      } else {
        // Tạo mới
        const res = await apiRequest('/api/admin/courses', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        if (res.success) {
          setIsModalOpen(false);
          fetchCourses();
        } else {
          setFormError(res.message || 'Không thể tạo khóa học mới.');
        }
      }
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Đã xảy ra lỗi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    setDeleting(true);
    try {
      const res = await apiRequest(`/api/admin/courses/${deletingCourse._id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setDeletingCourse(null);
        fetchCourses();
      } else {
        alert(res.message || 'Không thể xóa khóa học.');
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'Đã xảy ra lỗi khi xóa khóa học.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Nút quay lại trang trước */}
      <div>
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/admin/dashboard'))}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-xs hover:border-slate-300 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại trang trước</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-blue-600" />
            Quản Lý Khóa Học & Đề Thi GDQP&AN
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Thiết lập các học phần, bài giảng video, điều kiện qua môn và ngân hàng câu hỏi trắc nghiệm.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Khóa Học Mới</span>
        </button>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo mã học phần (GDQP1, GDQP2...) hoặc tên học phần..."
          className="w-full text-sm text-slate-800 focus:outline-hidden bg-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Xóa
          </button>
        )}
      </div>

      {/* Danh sách Khóa học */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
          <p className="text-slate-500 text-sm">Đang tải danh sách khóa học...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">Chưa có khóa học nào</h3>
          <p className="text-slate-500 text-sm mb-4">
            {searchQuery
              ? 'Không tìm thấy khóa học phù hợp với từ khóa.'
              : 'Hãy nhấn nút "Thêm Khóa Học Mới" để tạo học phần đầu tiên.'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Thêm khóa học ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                    {course.code}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      course.active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {course.active ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đang mở
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-slate-400" /> Tạm khóa
                      </>
                    )}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm mb-4 line-clamp-3 leading-relaxed">
                  {course.description || 'Chưa có mô tả chi tiết cho học phần này.'}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Layers className="w-4 h-4 text-blue-600" /> Số bài giảng:
                  </span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                    {course.totalLessons} bài học
                  </span>
                </div>

                {/* Các nút hành động */}
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    to={`/admin/courses/${course._id}/lessons`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs sm:text-sm font-bold transition-colors"
                  >
                    <span>Bài học & Đề thi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleOpenEditModal(course)}
                    title="Chỉnh sửa thông tin"
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeletingCourse(course)}
                    title="Xóa khóa học"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm / Sửa Khóa học */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {editingCourse ? 'Chỉnh Sửa Học Phần' : 'Thêm Học Phần Mới'}
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Điền mã học phần, tên môn và thiết lập trạng thái mở lớp.
            </p>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mã học phần *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ví dụ: GDQP1, GDQP2, QP-HP1"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên học phần *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ví dụ: Đường lối quốc phòng và an ninh của Đảng..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mô tả học phần
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nội dung giới thiệu tổng quan về học phần..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="activeCheckbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="activeCheckbox" className="text-sm font-semibold text-slate-800 cursor-pointer">
                  Mở học phần cho sinh viên vào học
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingCourse ? 'Lưu thay đổi' : 'Tạo học phần'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa Khóa học */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Xác nhận xóa học phần?
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Bạn có chắc chắn muốn xóa học phần <strong className="text-slate-900">{deletingCourse.title}</strong> (Mã: {deletingCourse.code})?
              <br />
              <span className="text-red-600 font-semibold block mt-2">
                ⚠️ Cảnh báo: Toàn bộ bài học, video và ngân hàng câu hỏi trắc nghiệm thuộc học phần này sẽ bị xóa vĩnh viễn khỏi hệ thống!
              </span>
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingCourse(null)}
                disabled={deleting}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteCourse}
                disabled={deleting}
                className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
