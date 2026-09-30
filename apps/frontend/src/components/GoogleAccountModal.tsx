import React, { useState } from 'react';
import { X, UserPlus, Shield } from 'lucide-react';

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: { email: string; name: string; googleId: string }) => void;
}

export const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!isOpen) return null;

  // Danh sách các tài khoản Google đã lưu hoặc mẫu gợi ý
  const sampleAccounts = [
    {
      name: 'Nguyễn Minh Chí',
      email: 'chinm.t2.2225@gmail.com',
      avatarText: 'C',
      bgColor: 'bg-blue-600',
    },
    {
      name: 'Sinh Viên GDQP&AN',
      email: 'sinhvien.gdqp@gmail.com',
      avatarText: 'S',
      bgColor: 'bg-emerald-600',
    },
  ];

  const handleSelect = (email: string, name: string) => {
    const googleId = `google_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    onSelectAccount({ email, name, googleId });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customName.trim()) return;
    handleSelect(customEmail.trim(), customName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 animate-scaleIn">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header chuẩn Google Identity */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-2 mb-3">
            <svg className="w-9 h-9" viewBox="0 0 24 24">
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
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Đăng Nhập Bằng Google</h3>
          <p className="text-xs text-slate-500 mt-1">
            Chọn một tài khoản Google để tiếp tục tới <strong>GDQP&AN E-Learning</strong>
          </p>
        </div>

        {/* Danh sách tài khoản Google */}
        <div className="space-y-2 mb-4">
          {sampleAccounts.map((acc) => (
            <div
              key={acc.email}
              onClick={() => handleSelect(acc.email, acc.name)}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition-all group"
            >
              <div
                className={`w-10 h-10 rounded-full ${acc.bgColor} text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0`}
              >
                {acc.avatarText}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-slate-900 block truncate group-hover:text-blue-700">
                  {acc.name}
                </span>
                <span className="text-xs text-slate-500 block truncate font-mono">
                  {acc.email}
                </span>
              </div>
            </div>
          ))}

          {/* Sử dụng một tài khoản khác */}
          {!showCustomInput ? (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-slate-700">Sử dụng tài khoản Google khác</span>
            </button>
          ) : (
            <form onSubmit={handleCustomSubmit} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 mt-2 animate-fadeIn">
              <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                Nhập tài khoản Google của bạn:
              </span>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Họ và tên trên Google (VD: Nguyễn Văn A)"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="Địa chỉ Gmail (VD: yourname@gmail.com)"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded-lg"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Tiếp tục
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer cam kết bảo mật */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          <span>Để tiếp tục, Google sẽ chia sẻ tên và địa chỉ email của bạn với GDQP&AN.</span>
        </div>
      </div>
    </div>
  );
};
