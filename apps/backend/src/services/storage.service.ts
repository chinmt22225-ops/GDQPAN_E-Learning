import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Request, Response } from 'express';
import multer from 'multer';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'videos');

// Đảm bảo thư mục lưu trữ video tồn tại
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Cấu hình Multer để upload video
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.mp4';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}_${base}${ext}`);
  },
});

export const videoUploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // Tối đa 500MB cho mỗi video bài giảng
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-matroska',
      'application/octet-stream',
    ];
    const isVideoExt = file.originalname && /\.(mp4|webm|mov|mkv|m4v|m3u8|avi)$/i.test(file.originalname);
    const isVideoMime = file.mimetype && (file.mimetype.startsWith('video/') || allowedMimes.includes(file.mimetype));

    if (isVideoExt || isVideoMime) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận các định dạng video hợp lệ (MP4, WebM, MOV, MKV).'));
    }
  },
});

export class StorageService {
  /**
   * Phát video với cơ chế HTTP 206 Partial Content (Range Requests)
   * Giúp trình duyệt load video từng đoạn, phát mượt và hỗ trợ chống tua lướt
   */
  static streamVideo(req: Request, res: Response, videoKey: string): void {
    if (!videoKey) {
      // Fallback về video mẫu Google Storage nếu bài học chưa được nạp video
      res.redirect('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      return;
    }

    // Nếu videoKey là một đường dẫn CDN / Cloudflare R2 / URL tuyệt đối
    if (videoKey.startsWith('http://') || videoKey.startsWith('https://')) {
      res.redirect(videoKey);
      return;
    }

    let filePath = path.join(UPLOAD_DIR, videoKey);
    const contestDir = path.resolve(process.cwd(), 'uploads', 'contest_videos');
    if (!fs.existsSync(filePath)) {
      const contestPath = path.join(contestDir, videoKey);
      if (fs.existsSync(contestPath)) {
        filePath = contestPath;
      }
    }

    if (!fs.existsSync(filePath)) {
      // Thử decodeURI nếu tên file chứa ký tự đặc biệt
      try {
        const decodedKey = decodeURIComponent(videoKey);
        const contestPathDecoded = path.join(contestDir, decodedKey);
        if (fs.existsSync(contestPathDecoded)) {
          filePath = contestPathDecoded;
        }
      } catch {
        // ignore error
      }
    }

    if (!fs.existsSync(filePath)) {
      // Nếu file local không tìm thấy, fallback sang video mẫu demo
      res.redirect('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Xác định mime type
    let contentType = 'video/mp4';
    if (videoKey.endsWith('.webm')) contentType = 'video/webm';
    else if (videoKey.endsWith('.mov')) contentType = 'video/quicktime';
    else if (videoKey.endsWith('.m3u8')) contentType = 'application/vnd.apple.mpegurl';

    if (range) {
      // Xử lý Range Request (Ví dụ: "bytes=0-1048576")
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).send('Requested range not satisfiable');
        return;
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });

      fs.createReadStream(filePath).pipe(res);
    }
  }

  /**
   * Xóa file video local nếu bài học bị xóa hoặc thay thế video mới
   */
  static deleteLocalVideo(videoKey: string): void {
    if (!videoKey || videoKey.startsWith('http://') || videoKey.startsWith('https://')) return;
    const filePath = path.join(UPLOAD_DIR, videoKey);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Không thể xóa file video cũ:', err);
      }
    }
  }

  private static durationCache = new Map<string, number>();

  /**
   * Quét và trả về thời lượng video tính bằng giây sử dụng ffprobe
   */
  static getVideoDurationInSeconds(filePath: string): number | null {
    try {
      if (!fs.existsSync(filePath)) return null;

      if (this.durationCache.has(filePath)) {
        return this.durationCache.get(filePath)!;
      }

      const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
      const output = execSync(cmd, { timeout: 4000, encoding: 'utf-8' });
      const sec = parseFloat(output.trim());
      if (!isNaN(sec) && sec > 0) {
        const rounded = Math.round(sec);
        this.durationCache.set(filePath, rounded);
        return rounded;
      }
    } catch {
      // ffprobe không khả dụng hoặc lỗi giải mã định dạng
    }
    return null;
  }

  /**
   * Tìm đường dẫn file vật lý của videoKey trên server
   */
  static resolveVideoFilePath(videoKey: string): string | null {
    if (!videoKey || videoKey.startsWith('http://') || videoKey.startsWith('https://')) {
      return null;
    }

    const candidateDirs = [
      UPLOAD_DIR,
      path.resolve(process.cwd(), 'uploads', 'contest_videos'),
      path.resolve(process.cwd(), 'apps', 'backend', 'uploads', 'contest_videos'),
      path.resolve(process.cwd(), 'apps', 'backend', 'uploads', 'videos'),
    ];

    for (const dir of candidateDirs) {
      const directPath = path.join(dir, videoKey);
      if (fs.existsSync(directPath)) return directPath;

      try {
        const decodedKey = decodeURIComponent(videoKey);
        const decodedPath = path.join(dir, decodedKey);
        if (fs.existsSync(decodedPath)) return decodedPath;
      } catch {
        // ignore decode error
      }
    }

    return null;
  }

  /**
   * Quét và trả về danh sách các file video có sẵn trên hệ thống kèm thời lượng tự động quét
   */
  static listAvailableVideos(): Array<{
    filename: string;
    sizeMB: number;
    group: string;
    durationSeconds: number;
    durationFormatted: string;
  }> {
    const results: Array<{
      filename: string;
      sizeMB: number;
      group: string;
      durationSeconds: number;
      durationFormatted: string;
    }> = [];
    const seen = new Set<string>();

    const dirs = [
      { path: path.resolve(process.cwd(), 'uploads', 'contest_videos'), group: 'Kho video GDQP&AN có sẵn' },
      { path: path.resolve(process.cwd(), 'apps', 'backend', 'uploads', 'contest_videos'), group: 'Kho video GDQP&AN có sẵn' },
      { path: UPLOAD_DIR, group: 'Video tải lên máy chủ' },
    ];

    for (const d of dirs) {
      if (fs.existsSync(d.path)) {
        try {
          const files = fs.readdirSync(d.path);
          for (const f of files) {
            if (/\.(mp4|webm|mov|mkv|m4v)$/i.test(f) && !seen.has(f)) {
              seen.add(f);
              const fullPath = path.join(d.path, f);
              const stat = fs.statSync(fullPath);
              const dur = StorageService.getVideoDurationInSeconds(fullPath) || 0;
              const m = Math.floor(dur / 60);
              const s = dur % 60;
              const formatted = dur > 0 ? `${m}:${s.toString().padStart(2, '0')}` : '';

              results.push({
                filename: f,
                sizeMB: Math.round((stat.size / (1024 * 1024)) * 10) / 10,
                group: d.group,
                durationSeconds: dur,
                durationFormatted: formatted,
              });
            }
          }
        } catch {
          // ignore read error
        }
      }
    }

    return results.sort((a, b) => a.filename.localeCompare(b.filename, 'vi', { numeric: true }));
  }
}
