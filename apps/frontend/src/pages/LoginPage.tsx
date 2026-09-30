import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { Shield, Lock, User, ArrowRight, AlertCircle, GraduationCap } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { login, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Google Modal State
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleMssv, setGoogleMssv] = useState('');
  const [googleSchool, setGoogleSchool] = useState('');
  const [googleClass, setGoogleClass] = useState('');
  const [submittingGoogle, setSubmittingGoogle] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Vui lòng nhập đầy đủ thông tin đăng nhập.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await login(identifier, password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/courses');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGoogleAuth = () => {
    setError(null);
    setGoogleEmail('');
    setGoogleName('');
    setGoogleMssv('');
    setGoogleSchool('');
    setGoogleClass('');
    setGoogleModalOpen(true);
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleMssv.trim() || !googleName.trim() || !googleEmail.trim()) {
      setError('Vui lòng nhập đầy đủ Email Google, Họ tên và Mã số sinh viên (MSSV).');
      return;
    }

    setSubmittingGoogle(true);
    setError(null);

    try {
      const googleId = `google_${googleEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const res = await apiRequest('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          email: googleEmail.trim().toLowerCase(),
          name: googleName.trim(),
          googleId,
          mssv: googleMssv.trim().toUpperCase(),
          school: googleSchool.trim(),
          class: googleClass.trim(),
        }),
      });

      if (res.success) {
        setGoogleModalOpen(false);
        await refreshUser();
        navigate('/courses');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Đăng nhập bằng Google thất bại.');
    } finally {
      setSubmittingGoogle(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-10">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-50 text-blue-700 rounded-2xl mb-3 shadow-xs">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Đăng Nhập Hệ Thống</h1>
          <p className="text-sm text-slate-500 mt-1">
            Trung tâm Giáo dục Quốc phòng và An ninh
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Nút Đăng nhập nhanh bằng Google */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleOpenGoogleAuth}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold rounded-2xl text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer hover:border-slate-400"
          >
            {/* Google Icon SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Đăng nhập bằng Google</span>
          </button>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hoặc dùng tài khoản mật khẩu
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mã số sinh viên (MSSV) hoặc Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="VD: 21110001 hoặc admin@gdqpan.edu.vn"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500 space-y-3">
          <p>
            Chưa có tài khoản học viên?{' '}
            <Link to="/register" className="text-blue-600 font-bold hover:underline">
              Đăng ký tài khoản ngay
            </Link>
          </p>
          <p>
            <Link to="/" className="text-slate-400 hover:text-slate-600 hover:underline">
              ← Quay lại trang chủ
            </Link>
          </p>
        </div>
      </div>

      {/* MODAL HOÀN TẤT THÔNG TIN CHO GOOGLE SIGN-IN */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl animate-scaleIn">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-blue-50 text-blue-700 rounded-2xl mb-2">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Đăng Nhập Bằng Google</h3>
              <p className="text-xs text-slate-500 mt-1">
                Vui lòng cung cấp <strong>Email Google</strong>, <strong>Họ tên</strong> và <strong>MSSV</strong> để định danh kết quả học tập.
              </p>
            </div>

            <form onSubmit={handleGoogleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Google Của Bạn <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="VD: sinhvien@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Họ và Tên Sinh Viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mã Số Sinh Viên (MSSV) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={googleMssv}
                  onChange={(e) => setGoogleMssv(e.target.value)}
                  placeholder="VD: 21110001"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Trường
                  </label>
                  <input
                    type="text"
                    value={googleSchool}
                    onChange={(e) => setGoogleSchool(e.target.value)}
                    placeholder="VD: ĐHQG-HCM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Lớp
                  </label>
                  <input
                    type="text"
                    value={googleClass}
                    onChange={(e) => setGoogleClass(e.target.value)}
                    placeholder="VD: 21DTH01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setGoogleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingGoogle}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {submittingGoogle ? 'Đang xác nhận...' : 'Đăng Nhập & Vào Học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
