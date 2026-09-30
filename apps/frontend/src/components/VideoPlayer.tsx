import React, { useRef, useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { VideoHeartbeatResponse } from '@elearning/shared';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  lessonId: string;
  videoUrl?: string;
  minCoveragePercent?: number;
  initialCoveragePercent?: number;
  initialVideoCompleted?: boolean;
  onVideoCompleted: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  lessonId,
  videoUrl,
  minCoveragePercent = 95,
  initialCoveragePercent = 0,
  initialVideoCompleted = false,
  onVideoCompleted,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [coverage, setCoverage] = useState<number>(initialCoveragePercent);
  const [completed, setCompleted] = useState<boolean>(initialVideoCompleted);
  const [highestWatchedTime, setHighestWatchedTime] = useState<number>(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Gửi heartbeat tiến độ lên Server
  const sendHeartbeat = async () => {
    if (!videoRef.current) return;
    const v = videoRef.current;

    try {
      const res = await apiRequest<VideoHeartbeatResponse>(
        `/api/student/lessons/${lessonId}/heartbeat`,
        {
          method: 'POST',
          body: JSON.stringify({
            currentTime: v.currentTime,
            playing: !v.paused,
            playbackRate: v.playbackRate,
          }),
        }
      );

      if (res.success && res.data) {
        setCoverage(res.data.coveragePercent);
        if (res.data.videoCompleted && !completed) {
          setCompleted(true);
          onVideoCompleted();
        }
      }
    } catch (err) {
      console.warn('Lỗi gửi heartbeat:', err);
    }
  };

  // Khởi động nhịp tim định kỳ mỗi 15 giây
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(sendHeartbeat, 15000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, lessonId, completed]);

  // Cập nhật mốc thời gian xem cao nhất & Khóa tua lướt
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;

    // Nếu tua vượt quá mốc đã xem hơn 2 giây -> Kéo lại ngay
    if (v.currentTime > highestWatchedTime + 2.5) {
      v.currentTime = highestWatchedTime;
      setWarningMessage('⚠️ Bạn không thể tua vượt qua đoạn bài giảng chưa học!');
      setTimeout(() => setWarningMessage(null), 3000);
    } else {
      setHighestWatchedTime((prev) => Math.max(prev, v.currentTime));
    }
  };

  const handleSeeking = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    if (v.currentTime > highestWatchedTime + 2) {
      v.currentTime = highestWatchedTime;
    }
  };

  const handleEnded = async () => {
    setIsPlaying(false);
    await sendHeartbeat();
  };

  // Fallback demo video nếu chưa có video thật nạp vào
  const fallbackVideoSrc =
    videoUrl ||
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800">
      {/* Khung phát Video */}
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          src={fallbackVideoSrc}
          controls
          playsInline
          controlsList="nodownload noplaybackrate"
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onPlay={() => setIsPlaying(true)}
          onPause={() => {
            setIsPlaying(false);
            sendHeartbeat();
          }}
          onEnded={handleEnded}
          className="w-full h-full object-contain"
        />

        {/* Cảnh báo tua lướt nhấp nháy */}
        {warningMessage && (
          <div className="absolute top-4 left-4 right-4 bg-amber-500/90 text-slate-900 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg backdrop-blur-sm animate-bounce">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{warningMessage}</span>
          </div>
        )}
      </div>

      {/* Thanh đo tiến độ thực chất */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-medium">
            {completed ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Đã hoàn thành thời lượng video ({coverage}%)
              </span>
            ) : (
              <span>Tiến độ xem thực tế (Cần đạt ≥ {minCoveragePercent}%)</span>
            )}
          </span>
          <span className="font-bold text-white font-mono">{coverage}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              completed ? 'bg-emerald-500' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(100, coverage)}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span className="text-slate-400 flex items-center gap-1">
            🔒 Khóa tua lướt: Chỉ cho phép tua lại các đoạn đã xem.
          </span>
          {completed && (
            <span className="text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
              ĐÃ MỞ KHÓA BÀI KIỂM TRA
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
