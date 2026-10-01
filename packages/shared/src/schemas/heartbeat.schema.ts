import { z } from 'zod';

export const videoHeartbeatSchema = z.object({
  currentTime: z.number().min(0, 'Thời gian phát không hợp lệ.'),
  playing: z.boolean(),
  playbackRate: z.number().min(0.5).max(2.0).default(1.0),
  duration: z.number().min(0).optional(),
});

export type VideoHeartbeatInput = z.infer<typeof videoHeartbeatSchema>;
