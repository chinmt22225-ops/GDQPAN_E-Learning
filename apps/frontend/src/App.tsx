import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Shield, BookOpen, UserCheck, Award } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full text-blue-900 mb-4">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          HỆ THỐNG HỌC TẬP & KHẢO THÍ TRỰC TUYẾN
        </h1>
        <p className="mt-2 text-lg text-slate-600 font-medium">
          Trung tâm Giáo dục Quốc phòng và An ninh
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Card Sinh viên */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Cổng Học Viên / Sinh Viên</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Xem bài giảng video bài học, theo dõi tiến độ học tập và tham gia làm bài kiểm tra trắc nghiệm theo từng bài.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full px-5 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors shadow-sm"
          >
            Đăng nhập Học tập
          </Link>
        </div>

        {/* Card Quản trị */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Cổng Quản Trị / Giảng Viên</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Theo dõi kết quả học tập trực tiếp thời gian thực, quản lý ngân hàng câu hỏi, import danh sách và xuất bảng điểm Excel.
          </p>
          <Link
            to="/admin/login"
            className="inline-flex items-center justify-center w-full px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Đăng nhập Quản trị
          </Link>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="mt-16 border-t border-slate-200 pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-slate-600 text-sm">
        <div className="flex flex-col items-center">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
            <Shield className="w-4 h-4 text-blue-600" /> Chống tua lướt video
          </span>
          <span>Kiểm soát thời gian xem thực chất từng bài giảng</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
            <Award className="w-4 h-4 text-emerald-600" /> Chấm điểm tức thì
          </span>
          <span>Bốc 10 câu ngẫu nhiên & xem giải thích câu sai</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
            <UserCheck className="w-4 h-4 text-indigo-600" /> Báo cáo Real-time
          </span>
          <span>Cập nhật trực tiếp kết quả Đạt / Chưa đạt</span>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={
            <div className="p-8 text-center">
              <h2 className="text-xl font-bold">Trang Đăng Nhập Sinh Viên (Đang xây dựng)</h2>
              <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">← Quay lại trang chủ</Link>
            </div>
          }
        />
        <Route
          path="/admin/login"
          element={
            <div className="p-8 text-center">
              <h2 className="text-xl font-bold">Trang Đăng Nhập Quản Trị (Đang xây dựng)</h2>
              <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">← Quay lại trang chủ</Link>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
