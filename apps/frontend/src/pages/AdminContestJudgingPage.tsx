import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import {
  ArrowLeft,
  Video,
  Play,
  CheckCircle2,
  Clock,
  HardDrive,
  Monitor,
  FileSpreadsheet,
  Download,
  ChevronLeft,
  ChevronRight,
  Save,
  Search,
  Award,
  Sparkles,
  Info,
} from 'lucide-react';

interface IJudgeScore {
  judgeName: string;
  techDurationScore: number;
  techSpecsScore: number;
  techVisualScore: number;
  techAudioScore: number;
  contentTitleScore: number;
  contentCoreScore: number;
  contentCreativeScore: number;
  totalScore: number;
  scoreInWords: string;
  rank: string;
  note: string;
  evaluatedAt?: string;
}

interface ISubmission {
  _id: string;
  stt: number;
  candidateName: string;
  videoFileName: string;
  durationSeconds: number;
  fileSizeBytes: number;
  sizeMB: number;
  resolution: string;
  width: number;
  height: number;
  autoTechDurationScore: number;
  autoTechSpecsScore: number;
  score?: IJudgeScore;
}

interface ContestStats {
  totalCandidates: number;
  gradedCount: number;
  pendingCount: number;
  averageScore: number;
  highestScore: number;
  topCandidate: {
    stt: number;
    candidateName: string;
    score: number;
  } | null;
}

function convertScoreToWords(score: number): string {
  const digitWords = ['Không', 'Một', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười'];
  const integerPart = Math.floor(score);
  const decimalPart = Math.round((score - integerPart) * 100);

  if (decimalPart === 0) {
    return digitWords[integerPart] || `${score}`;
  }

  const intWord = digitWords[integerPart] || `${integerPart}`;
  if (decimalPart === 50 || decimalPart === 5) {
    return `${intWord} phẩy năm`;
  }
  if (decimalPart === 25) {
    return `${intWord} phẩy hai lăm`;
  }
  if (decimalPart === 75) {
    return `${intWord} phẩy bảy lăm`;
  }
  return `${intWord} phẩy ${decimalPart}`;
}

function getRank(score: number): string {
  if (score >= 9.0) return 'Xuất sắc (Giải Nhất)';
  if (score >= 8.0) return 'Giỏi (Giải Nhì)';
  if (score >= 7.0) return 'Khá (Giải Ba)';
  if (score >= 5.0) return 'Đạt (Khuyến khích)';
  return 'Chưa đạt';
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const AdminContestJudgingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submissions, setSubmissions] = useState<ISubmission[]>([]);
  const [stats, setStats] = useState<ContestStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSTT, setSelectedSTT] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const [judgeName, setJudgeName] = useState<string>(user?.name || 'Ban Giám Khảo');

  // Form điểm của thí sinh đang chọn
  const [scoreForm, setScoreForm] = useState<{
    techDurationScore: number;
    techSpecsScore: number;
    techVisualScore: number;
    techAudioScore: number;
    contentTitleScore: number;
    contentCoreScore: number;
    contentCreativeScore: number;
    note: string;
  }>({
    techDurationScore: 0,
    techSpecsScore: 0,
    techVisualScore: 0,
    techAudioScore: 0,
    contentTitleScore: 0,
    contentCoreScore: 0,
    contentCreativeScore: 0,
    note: '',
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Tải danh sách thí sinh
  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{
        submissions: ISubmission[];
        stats: ContestStats;
      }>('/admin/contest/submissions');

      if (res.success && res.data) {
        setSubmissions(res.data.submissions);
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách thí sinh:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  // Thí sinh hiện tại
  const currentSubmission = useMemo(() => {
    return submissions.find((s) => s.stt === selectedSTT) || submissions[0] || null;
  }, [submissions, selectedSTT]);

  // Khi chuyển thí sinh, đồng bộ form chấm điểm
  useEffect(() => {
    if (currentSubmission) {
      if (currentSubmission.score) {
        setScoreForm({
          techDurationScore: currentSubmission.score.techDurationScore ?? currentSubmission.autoTechDurationScore,
          techSpecsScore: currentSubmission.score.techSpecsScore ?? currentSubmission.autoTechSpecsScore,
          techVisualScore: currentSubmission.score.techVisualScore ?? 0.75,
          techAudioScore: currentSubmission.score.techAudioScore ?? 0.75,
          contentTitleScore: currentSubmission.score.contentTitleScore ?? 1.0,
          contentCoreScore: currentSubmission.score.contentCoreScore ?? 2.5,
          contentCreativeScore: currentSubmission.score.contentCreativeScore ?? 0.75,
          note: currentSubmission.score.note || '',
        });
        if (currentSubmission.score.judgeName) {
          setJudgeName(currentSubmission.score.judgeName);
        }
      } else {
        // Khởi tạo điểm đề xuất theo thông số kỹ thuật tự động
        setScoreForm({
          techDurationScore: currentSubmission.autoTechDurationScore,
          techSpecsScore: currentSubmission.autoTechSpecsScore,
          techVisualScore: currentSubmission.height >= 720 ? 0.75 : 0.5,
          techAudioScore: 0.75,
          contentTitleScore: 1.0,
          contentCoreScore: 3.0,
          contentCreativeScore: 0.75,
          note: '',
        });
      }
      setSaveSuccessMsg('');
    }
  }, [currentSubmission]);

  // Tính tổng điểm tức thì
  const currentTotal = useMemo(() => {
    const sum =
      (Number(scoreForm.techDurationScore) || 0) +
      (Number(scoreForm.techSpecsScore) || 0) +
      (Number(scoreForm.techVisualScore) || 0) +
      (Number(scoreForm.techAudioScore) || 0) +
      (Number(scoreForm.contentTitleScore) || 0) +
      (Number(scoreForm.contentCoreScore) || 0) +
      (Number(scoreForm.contentCreativeScore) || 0);
    return Math.round(sum * 100) / 100;
  }, [scoreForm]);

  const currentScoreInWords = useMemo(() => convertScoreToWords(currentTotal), [currentTotal]);
  const currentRank = useMemo(() => getRank(currentTotal), [currentTotal]);

  // Lưu điểm
  const handleSaveScore = async (andNext: boolean = false) => {
    if (!currentSubmission) return;
    setSaving(true);
    setSaveSuccessMsg('');

    try {
      const res = await apiRequest<ISubmission>(`/admin/contest/submissions/${currentSubmission.stt}/score`, {
        method: 'PUT',
        body: JSON.stringify({
          judgeName,
          ...scoreForm,
        }),
      });

      if (res.success && res.data) {
        setSaveSuccessMsg(`Đã lưu điểm cho thí sinh: ${currentSubmission.candidateName} (${currentTotal} điểm)`);

        // Cập nhật state cục bộ
        setSubmissions((prev) =>
          prev.map((s) => (s.stt === currentSubmission.stt ? res.data! : s))
        );

        if (andNext && selectedSTT < submissions.length) {
          setTimeout(() => {
            setSelectedSTT((prev) => prev + 1);
          }, 400);
        }
      }
    } catch (err) {
      console.error('Lỗi khi lưu điểm:', err);
      alert('Có lỗi xảy ra khi lưu điểm thí sinh.');
    } finally {
      setSaving(false);
    }
  };

  // Xuất file Excel
  const handleExportExcel = () => {
    const token = localStorage.getItem('token') || '';
    const url = `/api/admin/contest/export-excel?judgeName=${encodeURIComponent(judgeName)}${token ? `&token=${token}` : ''}`;
    window.open(url, '_blank');
  };

  // Lọc thí sinh theo tìm kiếm
  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    const q = searchQuery.toLowerCase();
    return submissions.filter(
      (s) =>
        s.candidateName.toLowerCase().includes(q) ||
        s.stt.toString().includes(q) ||
        s.videoFileName.toLowerCase().includes(q)
    );
  }, [submissions, searchQuery]);

  if (loading && submissions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mb-3"></div>
        <p className="text-slate-600 text-sm font-semibold">Đang nạp dữ liệu Phòng Chấm Thi Video Trực Tuyến...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Tiêu đề & Nút thao tác đầu trang */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Bảng điều khiển Admin
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Phòng Chấm Thi Video Trực Tuyến
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Hội thi Xây dựng Nội dung Quán triệt Đầu Khóa học &bull; Thang điểm 10.0 Barem Giám khảo
              </p>
            </div>
          </div>
        </div>

        {/* Nút Xuất Excel & Tên Giám khảo */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-medium text-slate-500">Giám khảo:</span>
            <input
              type="text"
              value={judgeName}
              onChange={(e) => setJudgeName(e.target.value)}
              className="text-xs font-bold text-slate-800 focus:outline-hidden bg-transparent border-b border-dashed border-slate-300 px-1 py-0.5"
              placeholder="Nhập tên giám khảo"
            />
          </div>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors shadow-2xs"
            title="Tải bảng điểm Excel đúng chuẩn mẫu phôi"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Xuất Excel Bảng Điểm (.xlsx)</span>
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Thống kê Tổng quan (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng thí sinh</span>
            <Video className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-1">24</p>
          <span className="text-[11px] text-slate-400">Video bài thi tham gia</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Đã chấm</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">
            {stats?.gradedCount ?? 0} <span className="text-xs font-normal text-slate-400">/ 24</span>
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${Math.round(((stats?.gradedCount ?? 0) / 24) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Chưa chấm</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-extrabold text-amber-700 mt-1">{stats?.pendingCount ?? 24}</p>
          <span className="text-[11px] text-slate-400">Đang chờ đánh giá</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Điểm trung bình</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-extrabold text-indigo-700 mt-1">
            {stats?.averageScore ? `${stats.averageScore}` : '---'}{' '}
            <span className="text-xs font-normal text-slate-400">/ 10</span>
          </p>
          <span className="text-[11px] text-slate-400">Hội đồng chấm</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700">Điểm cao nhất</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-extrabold text-purple-700 mt-1">
            {stats?.highestScore ? `${stats.highestScore}` : '---'}
          </p>
          <span className="text-[11px] text-slate-500 truncate block" title={stats?.topCandidate?.candidateName}>
            {stats?.topCandidate ? `${stats.topCandidate.stt}. ${stats.topCandidate.candidateName}` : 'Chưa có'}
          </span>
        </div>
      </div>

      {/* Main Dual-Pane Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI: Video Player & Thông số kỹ thuật (7/12 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-md border border-slate-800">
            {/* Header thanh phát */}
            <div className="px-4 py-2.5 bg-slate-950/80 flex items-center justify-between text-slate-300 text-xs border-b border-slate-800">
              <span className="font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                STT {currentSubmission?.stt}: {currentSubmission?.candidateName}
              </span>
              <span className="text-slate-400 font-mono text-[11px] truncate max-w-[200px]">
                {currentSubmission?.videoFileName}
              </span>
            </div>

            {/* Video HTML5 Player */}
            <div className="relative bg-black aspect-video flex items-center justify-center">
              {currentSubmission ? (
                <video
                  ref={videoRef}
                  key={currentSubmission.videoFileName}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain"
                  src={`/api/admin/contest/submissions/${currentSubmission.stt}/video`}
                >
                  Trình duyệt không hỗ trợ phát thẻ video.
                </video>
              ) : (
                <div className="text-slate-500 text-sm">Chưa chọn video bài thi</div>
              )}
            </div>

            {/* Điều khiển tốc độ phát nhanh cho Ban giám khảo */}
            <div className="px-4 py-2 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-slate-400" /> Tốc độ xem lại:
              </span>
              <div className="flex items-center gap-1">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      if (videoRef.current) videoRef.current.playbackRate = rate;
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono transition-colors"
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hộp Thông số Kỹ thuật Thực tế Được Hệ thống Phân tích */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-blue-600" />
              Thông số Kỹ thuật Phân tích Tự động
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1 text-slate-500 mb-1">
                  <Clock className="w-3.5 h-3.5" /> Thời lượng thực tế
                </div>
                <div className="text-base font-bold text-slate-800">
                  {formatDuration(currentSubmission?.durationSeconds || 0)}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    ({Math.round(currentSubmission?.durationSeconds || 0)}s)
                  </span>
                </div>
                <div className="mt-1">
                  {currentSubmission && currentSubmission.durationSeconds >= 180 && currentSubmission.durationSeconds <= 300 ? (
                    <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                      Chuẩn 3-5 phút (+1.0đ)
                    </span>
                  ) : currentSubmission && ((currentSubmission.durationSeconds >= 150 && currentSubmission.durationSeconds < 180) || (currentSubmission.durationSeconds > 300 && currentSubmission.durationSeconds <= 360)) ? (
                    <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[10px]">
                      Lệch nhẹ (+0.5đ)
                    </span>
                  ) : (
                    <span className="inline-block px-1.5 py-0.5 bg-red-100 text-red-800 rounded font-semibold text-[10px]">
                      Sai thời lượng (0đ)
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1 text-slate-500 mb-1">
                  <HardDrive className="w-3.5 h-3.5" /> Dung lượng file
                </div>
                <div className="text-base font-bold text-slate-800">
                  {currentSubmission?.sizeMB || 0} <span className="text-xs font-normal text-slate-400">MB</span>
                </div>
                <div className="mt-1">
                  {currentSubmission && currentSubmission.sizeMB <= 300 ? (
                    <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                      &le; 300MB Đạt chuẩn (+1.0đ)
                    </span>
                  ) : (
                    <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[10px]">
                      &gt; 300MB Vượt chuẩn
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1 text-slate-500 mb-1">
                  <Monitor className="w-3.5 h-3.5" /> Độ phân giải
                </div>
                <div className="text-base font-bold text-slate-800 font-mono">
                  {currentSubmission?.resolution || '1280x720'}
                </div>
                <div className="mt-1">
                  {currentSubmission && currentSubmission.height >= 720 ? (
                    <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">
                      HD 720p / 1080p
                    </span>
                  ) : (
                    <span className="inline-block px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold text-[10px]">
                      SD Standard
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Quy chế thi quy định: Video bắt buộc từ 3-5 phút (tối đa 1đ), định dạng MP4 16:9 HD dung lượng &le;300MB (tối đa 1đ). Hệ thống tự động tính điểm kỹ thuật ở cột bên phải.
              </span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Barem Chấm Điểm 7 Tiêu Chí (5/12 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
            {/* Header thí sinh & Điều hướng */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Phiếu Chấm Điểm Thí Sinh #{currentSubmission?.stt}
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
                  {currentSubmission?.candidateName}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={selectedSTT <= 1}
                  onClick={() => setSelectedSTT((prev) => Math.max(1, prev - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Thí sinh trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-700 px-1">
                  {selectedSTT}/24
                </span>
                <button
                  disabled={selectedSTT >= submissions.length}
                  onClick={() => setSelectedSTT((prev) => Math.min(submissions.length, prev + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Thí sinh sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form 7 Tiêu chí Barem Chuẩn */}
            <div className="space-y-3.5 text-xs max-h-[460px] overflow-y-auto pr-1">
              {/* Tiêu chí 1 */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                  <span>1. Thời lượng video (3-5 phút)</span>
                  <span className="text-blue-700 font-bold font-mono">
                    {scoreForm.techDurationScore.toFixed(2)} / 1.0đ
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.25"
                    value={scoreForm.techDurationScore}
                    onChange={(e) =>
                      setScoreForm({ ...scoreForm, techDurationScore: parseFloat(e.target.value) })
                    }
                    className="w-full accent-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setScoreForm({ ...scoreForm, techDurationScore: currentSubmission?.autoTechDurationScore || 0 })
                    }
                    className="text-[10px] text-blue-600 hover:underline shrink-0"
                    title="Gán điểm tự động từ thông số"
                  >
                    Auto ({currentSubmission?.autoTechDurationScore})
                  </button>
                </div>
              </div>

              {/* Tiêu chí 2 */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                  <span>2. Dung lượng &le;300MB & Chuẩn HD 16:9</span>
                  <span className="text-blue-700 font-bold font-mono">
                    {scoreForm.techSpecsScore.toFixed(2)} / 1.0đ
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.25"
                    value={scoreForm.techSpecsScore}
                    onChange={(e) =>
                      setScoreForm({ ...scoreForm, techSpecsScore: parseFloat(e.target.value) })
                    }
                    className="w-full accent-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setScoreForm({ ...scoreForm, techSpecsScore: currentSubmission?.autoTechSpecsScore || 0 })
                    }
                    className="text-[10px] text-blue-600 hover:underline shrink-0"
                    title="Gán điểm tự động từ thông số"
                  >
                    Auto ({currentSubmission?.autoTechSpecsScore})
                  </button>
                </div>
              </div>

              {/* Tiêu chí 3 */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                  <span>3. Hình ảnh rõ nét, không rung lắc</span>
                  <span className="text-blue-700 font-bold font-mono">
                    {scoreForm.techVisualScore.toFixed(2)} / 1.0đ
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.25"
                  value={scoreForm.techVisualScore}
                  onChange={(e) =>
                    setScoreForm({ ...scoreForm, techVisualScore: parseFloat(e.target.value) })
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Tiêu chí 4 */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                  <span>4. Âm thanh rõ ràng, dứt khoát</span>
                  <span className="text-blue-700 font-bold font-mono">
                    {scoreForm.techAudioScore.toFixed(2)} / 1.0đ
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.25"
                  value={scoreForm.techAudioScore}
                  onChange={(e) =>
                    setScoreForm({ ...scoreForm, techAudioScore: parseFloat(e.target.value) })
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Tiêu chí 5 */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                  <span>5. Tiêu đề video phù hợp, rõ ràng</span>
                  <span className="text-blue-700 font-bold font-mono">
                    {scoreForm.contentTitleScore.toFixed(2)} / 1.0đ
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.25"
                  value={scoreForm.contentTitleScore}
                  onChange={(e) =>
                    setScoreForm({ ...scoreForm, contentTitleScore: parseFloat(e.target.value) })
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Tiêu chí 6: Trọng tâm quán triệt (4.0đ) */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80">
                <div className="flex items-center justify-between font-semibold text-slate-900 mb-1">
                  <span className="flex items-center gap-1 text-blue-900">
                    <Award className="w-3.5 h-3.5 text-blue-700" />
                    6. Nội dung quán triệt (Trọng tâm)
                  </span>
                  <span className="text-blue-900 font-extrabold font-mono text-sm">
                    {scoreForm.contentCoreScore.toFixed(2)} / 4.0đ
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="0.25"
                  value={scoreForm.contentCoreScore}
                  onChange={(e) =>
                    setScoreForm({ ...scoreForm, contentCoreScore: parseFloat(e.target.value) })
                  }
                  className="w-full accent-blue-700"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Đánh giá việc truyền tải 11 chế độ, 3 chế độ tuần, 8 hoạt động, nội vụ KTX.
                </span>
              </div>

              {/* Tiêu chí 7: Sáng tạo */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                  <span>7. Tính sáng tạo trong trình bày</span>
                  <span className="text-blue-700 font-bold font-mono">
                    {scoreForm.contentCreativeScore.toFixed(2)} / 1.0đ
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.25"
                  value={scoreForm.contentCreativeScore}
                  onChange={(e) =>
                    setScoreForm({ ...scoreForm, contentCreativeScore: parseFloat(e.target.value) })
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Ghi chú nhận xét */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Ghi chú / Nhận xét của Giám khảo:
                </label>
                <textarea
                  rows={2}
                  value={scoreForm.note}
                  onChange={(e) => setScoreForm({ ...scoreForm, note: e.target.value })}
                  placeholder="Nhập ưu điểm, hạn chế cần khắc phục của thí sinh..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-blue-500"
                />
              </div>
            </div>

            {/* BẢNG TỔNG KẾT ĐIỂM SỐ & XẾP LOẠI */}
            <div className="mt-4 p-3.5 bg-linear-to-r from-blue-700 to-indigo-800 text-white rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-blue-200 font-bold block">
                    Tổng Điểm Đánh Giá
                  </span>
                  <div className="text-2xl font-black tracking-tight">
                    {currentTotal.toFixed(2)} <span className="text-sm font-normal text-blue-200">/ 10.0</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-xs rounded-lg text-xs font-bold text-white mb-1">
                    {currentRank}
                  </span>
                  <div className="text-[11px] text-blue-100 font-medium italic">
                    &quot;{currentScoreInWords}&quot;
                  </div>
                </div>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="mt-3 p-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-200 flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Nút Hành Động Lưu Điểm */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveScore(false)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Đang lưu...' : 'Lưu Điểm Này'}</span>
              </button>

              <button
                type="button"
                disabled={saving || selectedSTT >= submissions.length}
                onClick={() => handleSaveScore(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <span>Lưu & Sang #</span>
                <span className="font-mono">{selectedSTT + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DANH SÁCH 24 THÍ SINH (DRAWER / GRID BÊN DƯỚI) */}
      <div className="mt-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Danh Sách 24 Thí Sinh Tham Dự Hội Thi
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              ({submissions.filter((s) => s.score?.totalScore).length}/24 đã chấm)
            </span>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên thí sinh hoặc STT..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {filteredSubmissions.map((sub) => {
            const isSelected = sub.stt === selectedSTT;
            const isGraded = sub.score && typeof sub.score.totalScore === 'number';

            return (
              <button
                key={sub.stt}
                onClick={() => setSelectedSTT(sub.stt)}
                className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                    : isGraded
                    ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono font-bold text-slate-500">#{sub.stt}</span>
                    {isGraded ? (
                      <span className="text-emerald-700 font-extrabold text-[11px] font-mono">
                        {sub.score?.totalScore?.toFixed(2)}đ
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Chưa</span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight">
                    {sub.candidateName}
                  </div>
                </div>

                <div className="mt-2 pt-1 border-t border-slate-200/60 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>{formatDuration(sub.durationSeconds)}</span>
                  <span>{sub.sizeMB}MB</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminContestJudgingPage;
