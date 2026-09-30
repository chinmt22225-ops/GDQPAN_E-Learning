import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { GoogleAccountModal } from '../components/GoogleAccountModal.js';
import { GoogleCompleteModal } from '../components/GoogleCompleteModal.js';
import { initiateGoogleAuth } from '../services/googleAuth.js';
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  GraduationCap,
  ShieldCheck,
  RotateCw,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface CaptchaData {
  captchaId: string;
  svg: string;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  // Biểu mẫu đăng ký trực tiếp
  const [name, setName] = useState('');
  const [mssv, setMssv] = useState('');
  const [phone, setPhone] = useState('');
  const [school, setSchool] = useState('');
  const [className, setClassName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // Trạng thái Captcha
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  // Trạng thái submit & lỗi
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Trạng thái Google OAuth Flow
  const [googleAccountModalOpen, setGoogleAccountModalOpen] = useState(false);
  const [googleCompleteModalOpen, setGoogleCompleteModalOpen] = useState(false);
  const [googleSelectedData, setGoogleSelectedData] = useState<{
    email: string;
    name: string;
    googleId: string;
  } | null>(null);

  // Lấy mã Captcha mới từ server
  const fetchCaptcha = async () => {
    setLoadingCaptcha(true);
    try {
      const res = await apiRequest<CaptchaData>('/api/auth/captcha');
      if (res.success && res.data) {
        setCaptcha(res.data);
        setCaptchaAnswer('');
      }
    } catch (err) {
      console.error('Lỗi lấy captcha:', err);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Xử lý nộp biểu mẫu đăng ký trực tiếp
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (!captcha?.captchaId) {
      setError('Mã bảo vệ chưa sẵn sàng. Vui lòng thử lại.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          mssv: mssv.trim().toUpperCase(),
          phone: phone.trim(),
          school: school.trim(),
          class: className.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
          captchaId: captcha.captchaId,
          captchaAnswer: captchaAnswer.trim(),
        }),
      });

      if (res.success) {
        setSuccess(true);
        await refreshUser();
        setTimeout(() => {
          navigate('/courses');
        }, 1500);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Đăng ký không thành công.');
      fetchCaptcha(); // Tự đổi mã captcha khi lỗi
    } finally {
      setSubmitting(false);
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
      // Kiểm tra tài khoản Google đã có trong hệ thống chưa
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

      // Nếu tài khoản Google đã có sẵn và không phải người dùng mới -> Đăng nhập vào luôn
      if (res.success && !isNew) {
        setSuccess(true);
        await refreshUser();
        navigate('/courses');
        return;
      }

      // Nếu là tài khoản Google mới -> Mở bước 2: Trang hoàn tất thông tin (MSSV, SĐT, Trường, Lớp, Mật khẩu)
      setGoogleSelectedData({
        email: res.data?.email || account.email,
        name: res.data?.name || account.name,
        googleId: res.data?.googleId || account.googleId,
      });
      setGoogleCompleteModalOpen(true);
    } catch (err: unknown) {
      setError((err as Error).message || 'Xác thực Google thất bại.');
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
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-50 text-blue-700 rounded-2xl mb-3 shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Đăng Ký Tài Khoản Học Viên
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Trung tâm Giáo dục Quốc phòng và An ninh
          </p>
        </div>

        {/* Thông báo Thành công */}
        {success && (
          <div className="mb-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-fadeIn">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-emerald-950">Đăng Ký Thành Công!</h3>
            <p className="text-sm text-emerald-800 mt-1">
              Đang chuyển hướng bạn vào danh sách học phần...
            </p>
          </div>
        )}

        {/* Thông báo Lỗi */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* CÁCH 1: ĐĂNG KÝ BẰNG TÀI KHOẢN GOOGLE */}
        <div className="mb-8">
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
            <span>Đăng ký nhanh bằng Google</span>
          </button>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hoặc điền biểu mẫu đăng ký bên dưới
            </span>
          </div>
        </div>

        {/* CÁCH 2: FORM ĐĂNG KÝ BẰNG TÀI KHOẢN MẬT KHẨU (KÈM SĐT, TRƯỜNG, LỚP, CAPTCHA) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Họ và Tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            {/* Mã số sinh viên */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã Số Sinh Viên (MSSV) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={mssv}
                  onChange={(e) => setMssv(e.target.value)}
                  placeholder="VD: 21110001"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Số Điện Thoại (SĐT) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 0912345678"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Địa Chỉ Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="VD: sinhvien@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Trường */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Trường Đại Học / Cao Đẳng <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="VD: ĐHQG-HCM, ĐH Bách Khoa..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            {/* Lớp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Lớp Sinh Hoạt <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="VD: 21DTH01"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mật khẩu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mật Khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            {/* Nhập lại mật khẩu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nhập Lại Mật Khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận lại mật khẩu"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>
          </div>

          {/* KHỐI NHẬP CAPTCHA */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Mã Bảo Vệ (Captcha) <span className="text-red-500">*</span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Hình ảnh Captcha SVG */}
              <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-slate-200">
                {captcha?.svg ? (
                  <img src={captcha.svg} alt="Mã bảo vệ" className="h-10 rounded-lg select-none" />
                ) : (
                  <div className="h-10 w-32 bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-xs text-slate-400">
                    Đang tải...
                  </div>
                )}
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  disabled={loadingCaptcha}
                  title="Đổi mã bảo vệ khác"
                  className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <RotateCw className={`w-4 h-4 ${loadingCaptcha ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Ô nhập mã Captcha */}
              <input
                type="text"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
                placeholder="Nhập 4 ký tự trong hình"
                maxLength={6}
                className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || success}
            className="w-full mt-4 py-3.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-2xl text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Đang tạo tài khoản...' : 'Hoàn Tất Đăng Ký Tài Khoản'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Chuyển sang Đăng nhập */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          Đã có tài khoản học tập?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            Đăng nhập tại đây
          </Link>
        </div>
      </div>

      {/* POPUP CHỌN TÀI KHOẢN GOOGLE */}
      <GoogleAccountModal
        isOpen={googleAccountModalOpen}
        onClose={() => setGoogleAccountModalOpen(false)}
        onSelectAccount={handleSelectGoogleAccount}
      />

      {/* POPUP BƯỚC 2: HOÀN TẤT THÔNG TIN HỌC VIÊN KHI ĐĂNG KÝ QUA GOOGLE */}
      <GoogleCompleteModal
        isOpen={googleCompleteModalOpen}
        onClose={() => setGoogleCompleteModalOpen(false)}
        googleData={googleSelectedData}
      />
    </div>
  );
};
