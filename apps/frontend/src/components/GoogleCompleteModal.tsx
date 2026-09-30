import React, { useState } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, User, Phone, Building2, Lock, ArrowRight, AlertCircle, X } from 'lucide-react';

interface GoogleCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleData: {
    email: string;
    name: string;
    googleId: string;
  } | null;
}

export const GoogleCompleteModal: React.FC<GoogleCompleteModalProps> = ({
  isOpen,
  onClose,
  googleData,
}) => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [name, setName] = useState(googleData?.name || '');
  const [mssv, setMssv] = useState('');
  const [phone, setPhone] = useState('');
  const [school, setSchool] = useState('');
  const [className, setClassName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cập nhật dữ liệu khi googleData thay đổi
  React.useEffect(() => {
    if (googleData) {
      setName(googleData.name || '');
      setMssv('');
      setPhone('');
      setSchool('');
      setClassName('');
      setPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [googleData]);

  if (!isOpen || !googleData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          email: googleData.email,
          googleId: googleData.googleId,
          name: name.trim(),
          mssv: mssv.trim().toUpperCase(),
          phone: phone.trim(),
          school: school.trim(),
          class: className.trim(),
          password,
        }),
      });

      if (res.success) {
        await refreshUser();
        onClose();
        navigate('/courses');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Hoàn tất thông tin thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 my-8 animate-scaleIn">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-50 text-blue-700 rounded-2xl mb-2">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Hoàn Tất Thông Tin Học Viên</h2>
          <p className="text-xs text-slate-500 mt-1">
            Tài khoản Google: <strong className="text-blue-700 font-mono">{googleData.email}</strong>
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Vui lòng nhập đầy đủ thông tin bên dưới để định danh và liên kết tài khoản.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Họ và tên */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Họ và Tên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* MSSV */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mã Số Sinh Viên (MSSV) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={mssv}
                onChange={(e) => setMssv(e.target.value)}
                placeholder="VD: 21110001"
                className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Số Điện Thoại (SĐT) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 0912345678"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Trường */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Trường Đại Học / Cao Đẳng <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="VD: ĐHQG-HCM"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Lớp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Lớp Sinh Hoạt <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="VD: 21DTH01"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Mật khẩu liên kết để sau này đăng nhập bằng MSSV / SĐT */}
          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200">
            <span className="text-xs font-bold text-blue-900 block mb-1">
              Thiết lập mật khẩu đăng nhập trực tiếp:
            </span>
            <p className="text-[11px] text-blue-800 mb-2 leading-relaxed">
              Mật khẩu này giúp bạn sau này có thể đăng nhập bằng cả 2 cách: bấm <strong>Google</strong> HOẶC gõ <strong>MSSV / Số điện thoại</strong> + Mật khẩu này.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu (≥ 6 ký tự)"
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu"
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              <span>{loading ? 'Đang kích hoạt...' : 'Hoàn Tất Đăng Ký & Vào Học'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
