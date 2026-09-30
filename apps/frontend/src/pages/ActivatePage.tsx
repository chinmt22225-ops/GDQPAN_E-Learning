import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export const ActivatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Mã xác thực không hợp lệ hoặc thiếu trong liên kết.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest('/api/auth/activate', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Kích hoạt tài khoản thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-emerald-50 text-emerald-700 rounded-2xl mb-3">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Kích Hoạt Tài Khoản</h1>
          <p className="text-sm text-slate-500 mt-1">
            Thiết lập mật khẩu lần đầu để bắt đầu học tập
          </p>
        </div>

        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-emerald-950 mb-1">Kích Hoạt Thành Công!</h3>
            <p className="text-sm text-emerald-800">
              Đang chuyển hướng bạn sang trang đăng nhập trong giây lát...
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tạo Mật Khẩu Mới
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nhập Lại Mật Khẩu
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận lại mật khẩu"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full mt-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors disabled:opacity-60"
              >
                {loading ? 'Đang kích hoạt...' : 'Kích hoạt & Đặt mật khẩu'}
              </button>
            </form>
          </>
        )}

        <div className="mt-8 text-center text-xs text-slate-500">
          <Link to="/login" className="text-blue-600 hover:underline">
            Đã có tài khoản? Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
