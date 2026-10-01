import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ActivatePage } from './pages/ActivatePage.js';
import { StudentCoursesPage } from './pages/StudentCoursesPage.js';
import { LessonLearnPage } from './pages/LessonLearnPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { AdminStudentsPage } from './pages/AdminStudentsPage.js';
import { AdminCoursesPage } from './pages/AdminCoursesPage.js';
import { AdminCourseLessonsPage } from './pages/AdminCourseLessonsPage.js';
import { Shield, BookOpen, UserCheck, Award, ArrowRight } from 'lucide-react';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
      <header className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3.5 bg-blue-100 rounded-2xl text-blue-900 mb-4 shadow-xs">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          HỆ THỐNG HỌC TẬP & KHẢO THÍ TRỰC TUYẾN
        </h1>
        <p className="mt-2 text-lg text-slate-600 font-medium">
          Trung tâm Giáo dục Quốc phòng và An ninh
        </p>
      </header>

      {/* Cổng đăng nhập phân luồng */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Card Sinh viên */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-10 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Cổng Học Viên / Sinh Viên</h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Xem video bài giảng lý thuyết (chống tua lướt), làm bài kiểm tra trắc nghiệm từng bài và xem giải thích chi tiết.
            </p>
          </div>
          <div className="space-y-2">
            <Link
              to={user?.role === 'student' ? '/courses' : '/login'}
              className="inline-flex items-center justify-center w-full px-5 py-3.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors shadow-sm gap-2"
            >
              <span>{user?.role === 'student' ? 'Vào học phần của bạn' : 'Đăng nhập Học tập'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {!user && (
              <Link
                to="/register"
                className="inline-flex items-center justify-center w-full px-5 py-2.5 text-xs font-bold text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-colors gap-1"
              >
                <span>Chưa có tài khoản? Đăng ký ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Card Quản trị */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-10 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
              <UserCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Cổng Giảng Viên & Quản Trị</h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Theo dõi kết quả nộp bài trực tiếp (Real-time SSE), nạp danh sách lớp qua Excel và trích xuất bảng điểm hoàn thành.
            </p>
          </div>
          <Link
            to={user?.role === 'admin' ? '/admin/dashboard' : '/admin/login'}
            className="inline-flex items-center justify-center w-full px-5 py-3.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors gap-2"
          >
            <span>{user?.role === 'admin' ? 'Vào bảng điều khiển' : 'Đăng nhập Quản trị'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="mt-16 border-t border-slate-200 pt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-slate-600 text-sm">
        <div className="flex flex-col items-center">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
            <Shield className="w-4 h-4 text-blue-600" /> Chống tua lướt video
          </span>
          <span className="text-xs text-slate-500">Kiểm soát thời gian xem thực chất từng giây</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
            <Award className="w-4 h-4 text-emerald-600" /> Chấm điểm tự động 100%
          </span>
          <span className="text-xs text-slate-500">Hiển thị lời giải thích câu sai cho sinh viên</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
            <UserCheck className="w-4 h-4 text-indigo-600" /> Báo cáo Live Dashboard
          </span>
          <span className="text-xs text-slate-500">Cập nhật trực tiếp kết quả Đạt / Chưa đạt</span>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/activate" element={<ActivatePage />} />
              <Route path="/courses" element={<StudentCoursesPage />} />
              <Route path="/courses/:courseId/learn" element={<LessonLearnPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/courses" element={<AdminCoursesPage />} />
              <Route path="/admin/courses/:courseId/lessons" element={<AdminCourseLessonsPage />} />
              <Route path="/admin/students" element={<AdminStudentsPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
