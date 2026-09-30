import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, User, BookOpen, LayoutDashboard, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tên đơn vị */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wide block leading-tight">
                E-LEARNING GDQP&AN
              </span>
              <span className="text-xs text-slate-400 block">Trung tâm Giáo dục Quốc phòng và An ninh</span>
            </div>
          </Link>

          {/* Menu Điều hướng & Tài khoản */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.role === 'student' ? (
                  <Link
                    to="/courses"
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Khóa học</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <Link
                      to="/admin/students"
                      className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      <span className="hidden sm:inline">Sinh viên</span>
                    </Link>
                  </>
                )}

                <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block"></div>

                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-800 text-xs">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-semibold text-slate-200">{user.name}</span>
                  <span className="text-slate-400 font-mono">({user.mssv})</span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Đăng nhập
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
