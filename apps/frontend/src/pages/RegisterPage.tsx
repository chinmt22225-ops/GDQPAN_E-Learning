import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import {
  User,
  Mail,
  Lock,
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

  // Form Fields
  const [name, setName] = useState('');
  const [mssv, setMssv] = useState('');
  const [school, setSchool] = useState('');
  const [className, setClassName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // Captcha State
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  // Status State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Google Modal State
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleMssv, setGoogleMssv] = useState('');
  const [googleSchool, setGoogleSchool] = useState('');
  const [googleClass, setGoogleClass] = useState('');
  const [submittingGoogle, setSubmittingGoogle] = useState(false);

  // Tải mã Captcha mới
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

  // Xử lý nộp biểu mẫu đăng ký truyền thống
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    if (!captcha?.captchaId) {
      setError('Mã bảo vệ chưa sẵn sàng. Vui lòng tải lại trang.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          mssv: mssv.trim().toUpperCase(),
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
      // Đổi captcha mới sau khi lỗi
      fetchCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  // Mở luồng đăng ký qua Google
  const handleOpenGoogleAuth = () => {
    setError(null);
    setGoogleEmail('');
    setGoogleName('');
    setGoogleMssv('');
    setGoogleSchool(school);
    setGoogleClass(className);
    setGoogleModalOpen(true);
  };

  // Xác nhận đăng ký qua Google (Bắt buộc MSSV và Họ Tên)
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
        setSuccess(true);
        await refreshUser();
        setTimeout(() => {
          navigate('/courses');
        }, 1500);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Đăng ký bằng Google thất bại.');
    } finally {
      setSubmittingGoogle(false);
    }
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
              Hệ thống đang chuyển hướng bạn vào danh sách học phần...
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

        {/* PHƯƠNG ÁN 1: ĐĂNG KÝ NHANH QUA GOOGLE */}
        <div className="mb-8">
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
            <span>Đăng ký & Đăng nhập bằng Google</span>
          </button>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hoặc điền biểu mẫu đăng ký bên dưới
            </span>
          </div>
        </div>

        {/* PHƯƠNG ÁN 2: FORM ĐĂNG KÝ TRUYỀN THỐNG */}
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
                Xác Nhận Mật Khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
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

        {/* Chân trang chuyển sang Đăng nhập */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          Đã có tài khoản học tập?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            Đăng nhập tại đây
          </Link>
        </div>
      </div>

      {/* MODAL HOÀN TẤT THÔNG TIN CHO GOOGLE SIGN-IN (BẮT BUỘC NHẬP MSSV & HỌ TÊN) */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl animate-scaleIn">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-blue-50 text-blue-700 rounded-2xl mb-2">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Xác Nhận Đăng Ký Bằng Google</h3>
              <p className="text-xs text-slate-500 mt-1">
                Theo quy định, bạn bắt buộc phải cung cấp <strong>MSSV</strong> và <strong>Họ tên</strong> để hệ thống ghi nhận điểm số học phần.
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
                  {submittingGoogle ? 'Đang xác nhận...' : 'Đăng Ký & Vào Học Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
