import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client.js';
import {
  Search,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface StudentRow {
  _id: string;
  mssv: string;
  name: string;
  class?: string;
  email: string;
  isActive: boolean;
  allPassed: boolean;
  completedAt?: string;
}

interface StudentListResponse {
  data: StudentRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Import Modal
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        q: search,
        status: statusFilter,
      });

      const res = await apiRequest<StudentRow[]>(`/api/admin/students?${query.toString()}`);
      if (res.success && res.data) {
        const payload = res as unknown as StudentListResponse;
        setStudents(payload.data || []);
        setTotal(payload.total || 0);
        setTotalPages(payload.totalPages || 1);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách sinh viên:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    setImportMessage(null);

    try {
      const arrayBuffer = await importFile.arrayBuffer();
      const res = await fetch('/api/admin/students/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: arrayBuffer,
        credentials: 'include',
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Lỗi khi import file.');
      }

      setImportMessage(`✅ ${json.message}`);
      setImportFile(null);
      fetchStudents();
    } catch (err: unknown) {
      setImportMessage(`❌ ${(err as Error).message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản Lý Sinh Viên</h1>
          <p className="text-slate-600 text-sm mt-0.5">
            Tổng cộng: <strong>{total} sinh viên</strong> trong danh sách hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Nạp Danh Sách Excel</span>
          </button>
          <a
            href="/api/admin/export.xlsx"
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Bảng Điểm</span>
          </a>
        </div>
      </div>

      {/* Toolbar: Tìm kiếm & Lọc */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo MSSV, Họ tên, Email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          >
            <option value="">Tất cả sinh viên</option>
            <option value="passed">Đã hoàn thành (ĐẠT)</option>
            <option value="pending">Chưa hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Bảng danh sách sinh viên */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
              <tr>
                <th className="px-6 py-3.5">STT</th>
                <th className="px-6 py-3.5">MSSV</th>
                <th className="px-6 py-3.5">Họ và Tên</th>
                <th className="px-6 py-3.5">Lớp</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5 text-center">Tài Khoản</th>
                <th className="px-6 py-3.5 text-center">Trạng Thái Môn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Không tìm thấy sinh viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {(page - 1) * 20 + idx + 1}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono">{s.mssv}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{s.name}</td>
                    <td className="px-6 py-4 text-slate-600">{s.class || '—'}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{s.email}</td>
                    <td className="px-6 py-4 text-center">
                      {s.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Đã kích hoạt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Chưa kích hoạt
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {s.allPassed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ĐẠT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> CHƯA ĐẠT
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Trang {page} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Nạp File Excel */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl relative animate-scaleIn">
            <button
              onClick={() => {
                setImportModalOpen(false);
                setImportMessage(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Nạp Danh Sách Sinh Viên</h3>
                <p className="text-xs text-slate-500">Định dạng hỗ trợ: .xlsx hoặc .xls</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5 mb-6">
              <span className="font-bold text-slate-800 block">Quy chuẩn các cột trong file Excel:</span>
              <p>• Cột A: Số thứ tự (STT)</p>
              <p>• Cột B: <strong>Mã số sinh viên (MSSV)</strong></p>
              <p>• Cột C: <strong>Họ và tên</strong></p>
              <p>• Cột D: Lớp</p>
              <p>• Cột E: <strong>Email sinh viên</strong> (để hệ thống gửi link kích hoạt)</p>
            </div>

            {importMessage && (
              <div className="mb-4 p-3 rounded-xl bg-slate-100 text-xs font-semibold text-slate-800">
                {importMessage}
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                required
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {importing ? 'Đang xử lý...' : 'Bắt đầu Import & Gửi Mail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
