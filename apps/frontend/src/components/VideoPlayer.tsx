import React, { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import { apiRequest } from '../api/client.js';
import { VideoHeartbeatResponse } from '@elearning/shared';
import { CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

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
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [coverage, setCoverage] = useState<number>(initialCoveragePercent);
  const [completed, setCompleted] = useState<boolean>(initialVideoCompleted);
  const [highestWatchedTime, setHighestWatchedTime] = useState<number>(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Nguồn phát video: Ưu tiên link truyền vào hoặc stream trực tiếp từ API bài học
  const activeVideoSource =
    videoUrl && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://'))
      ? videoUrl
      : `/api/student/lessons/${lessonId}/stream`;

  // Khởi tạo luồng phát (HLS hoặc MP4 trực tiếp)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isHls = activeVideoSource.includes('.m3u8');

    // Hủy instance HLS cũ nếu có
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(activeVideoSource);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
      hlsRef.current = hls;
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Hỗ trợ HLS native trên Safari / iOS
      video.src = activeVideoSource;
    } else {
      // Định dạng MP4 / WebM thông thường
      video.src = activeVideoSource;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeVideoSource]);

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

  // Khóa tua lướt & theo dõi mốc đã học cao nhất
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;

    // Nếu tua vượt quá mốc đã xem hơn 2.5 giây -> Kéo lại ngay
    if (v.currentTime > highestWatchedTime + 2.5) {
      v.currentTime = highestWatchedTime;
      setWarningMessage('⚠️ Hệ thống phát hiện bạn đang tua lướt! Vui lòng xem tuần tự bài giảng.');
      setTimeout(() => setWarningMessage(null), 3500);
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

  // Chống tăng tốc độ video (speed-lock <= 1.0x)
  const handleRateChange = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    if (v.playbackRate > 1.05) {
      v.playbackRate = 1.0;
      setWarningMessage('⚠️ Tốc độ phát bị khóa cố định ở 1.0x để đảm bảo tiếp thu kiến thức quốc phòng.');
      setTimeout(() => setWarningMessage(null), 3500);
    }
  };

  const handleEnded = async () => {
    setIsPlaying(false);
    await sendHeartbeat();
  };

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800">
      {/* Khung phát Video */}
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          controls
          playsInline
          controlsList="nodownload noplaybackrate"
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onRateChange={handleRateChange}
          onPlay={() => setIsPlaying(true)}
          onPause={() => {
            setIsPlaying(false);
            sendHeartbeat();
          }}
          onEnded={handleEnded}
          className="w-full h-full object-contain"
        />

        {/* Cảnh báo tua lướt hoặc hack tốc độ */}
        {warningMessage && (
          <div className="absolute top-4 left-4 right-4 bg-amber-500/95 text-slate-950 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-2xl backdrop-blur-md animate-bounce border border-amber-300">
            <ShieldAlert className="w-5 h-5 text-red-700 flex-shrink-0" />
            <span>{warningMessage}</span>
          </div>
        )}
      </div>

      {/* Thanh đo tiến độ thực chất */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-medium">
            {completed ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Đã hoàn thành thời lượng bài giảng ({coverage}%)
              </span>
            ) : (
              <span>Tiến độ xem thực tế (Cần đạt ≥ {minCoveragePercent}%)</span>
            )}
          </span>
          <span
            className={`font-black font-mono text-sm ${
              completed ? 'text-emerald-400' : 'text-blue-400'
            }`}
          >
            {coverage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              completed ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(100, coverage)}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span className="text-slate-400 flex items-center gap-1.5">
            🔒 <strong>Chống gian lận:</strong> Khóa tốc độ 1.0x & thanh tua chỉ cho phép xem lại đoạn cũ.
          </span>
          {completed ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-700/80 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> ĐÃ MỞ KHÓA BÀI KIỂM TRA
            </span>
          ) : (
            <span className="text-slate-500">
              Xem đủ {minCoveragePercent}% để mở bài trắc nghiệm
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
