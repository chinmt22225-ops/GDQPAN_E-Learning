import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { GoogleAccountModal } from '../components/GoogleAccountModal.js';
import { GoogleCompleteModal } from '../components/GoogleCompleteModal.js';
import { initiateGoogleAuth } from '../services/googleAuth.js';
import { Shield, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { login, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Trạng thái đăng nhập Google
  const [googleAccountModalOpen, setGoogleAccountModalOpen] = useState(false);
  const [googleCompleteModalOpen, setGoogleCompleteModalOpen] = useState(false);
  const [googleSelectedData, setGoogleSelectedData] = useState<{
    email: string;
    name: string;
    googleId: string;
  } | null>(null);

  // Đăng nhập trực tiếp bằng MSSV / SĐT + Mật khẩu
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

  // Bước 1: Khi học sinh chọn một tài khoản Google
  const handleSelectGoogleAccount = async (account: {
    email: string;
    name: string;
    googleId: string;
  }) => {
    setGoogleAccountModalOpen(false);
    setError(null);

    try {
      // Gọi backend kiểm tra tài khoản Google
      const res = await apiRequest<{
        isNewUser?: boolean;
        user?: any;
        email?: string;
        name?: string;
        googleId?: string;
      }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          email: account.email,
          googleId: account.googleId,
          name: account.name,
        }),
      });

      // Kiểm tra rõ ràng cờ isNewUser (tài khoản chưa từng hoàn tất đăng ký)
      const isNew = res.isNewUser === true || res.data?.isNewUser === true;

      // Nếu tài khoản Google đã có trong hệ thống và không phải tài khoản mới -> Đăng nhập thành công ngay
      if (res.success && !isNew) {
        await refreshUser();
        navigate('/courses');
        return;
      }

      // Nếu là tài khoản Google lần đầu đăng nhập/chưa hoàn tất -> Mở form hoàn tất thông tin
      setGoogleSelectedData({
        email: res.data?.email || account.email,
        name: res.data?.name || account.name,
        googleId: res.data?.googleId || account.googleId,
      });
      setGoogleCompleteModalOpen(true);
    } catch (err: unknown) {
      setError((err as Error).message || 'Đăng nhập bằng Google thất bại.');
    }
  };

  const handleGoogleClick = () => {
    setError(null);
    initiateGoogleAuth({
      onSuccess: handleSelectGoogleAccount,
      onError: (err) => setError(err),
      onFallback: () => setGoogleAccountModalOpen(true),
    });
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
            onClick={handleGoogleClick}
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
              Mã số sinh viên (MSSV) hoặc Số điện thoại
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="VD: 21110001 hoặc 0912345678"
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

      {/* POPUP CHỌN TÀI KHOẢN GOOGLE */}
      <GoogleAccountModal
        isOpen={googleAccountModalOpen}
        onClose={() => setGoogleAccountModalOpen(false)}
        onSelectAccount={handleSelectGoogleAccount}
      />

      {/* POPUP HOÀN TẤT THÔNG TIN CHO GOOGLE SIGN-IN */}
      <GoogleCompleteModal
        isOpen={googleCompleteModalOpen}
        onClose={() => setGoogleCompleteModalOpen(false)}
        googleData={googleSelectedData}
      />
    </div>
  );
};
