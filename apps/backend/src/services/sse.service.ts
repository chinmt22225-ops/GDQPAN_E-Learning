import { Response } from 'express';

interface AdminClient {
  id: string;
  res: Response;
}

class SSEService {
  private clients: Map<string, AdminClient> = new Map();

  constructor() {
    // Ping keepalive mỗi 25s để Nginx không ngắt kết nối SSE
    setInterval(() => {
      this.sendKeepAlive();
    }, 25000);
  }

  addAdminClient(id: string, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Tắt buffer cho Nginx
    res.flushHeaders();

    this.clients.set(id, { id, res });
    console.log(`Admin client kết nối SSE: ${id}. Tổng số kết nối: ${this.clients.size}`);

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE stream connected' })}\n\n`);

    res.on('close', () => {
      this.clients.delete(id);
      console.log(`Admin client ngắt kết nối SSE: ${id}. Còn lại: ${this.clients.size}`);
    });
  }

  broadcastQuizResult(data: {
    studentId: string;
    studentName: string;
    mssv: string;
    lessonTitle: string;
    score: number;
    passed: boolean;
    timestamp: Date | string;
  }) {
    const payload = JSON.stringify({
      type: 'QUIZ_SUBMITTED',
      data,
    });

    for (const client of this.clients.values()) {
      try {
        client.res.write(`data: ${payload}\n\n`);
      } catch (err) {
        console.warn(`Lỗi gửi SSE tới client ${client.id}:`, err);
      }
    }
  }

  private sendKeepAlive() {
    for (const client of this.clients.values()) {
      try {
        client.res.write(': keepalive\n\n');
      } catch {
        // ignore
      }
    }
  }
}

export const sseService = new SSEService();
