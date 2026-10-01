# ====================================================================
# DOCKERFILE CHO PHIÊN BẢN GỘP FULLSTACK E-LEARNING GDQP&AN
# ====================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# 1. Sao chép các tệp cấu hình package & tsconfig
COPY package*.json tsconfig*.json ./
COPY packages/shared/package*.json packages/shared/tsconfig*.json ./packages/shared/
COPY apps/backend/package*.json apps/backend/tsconfig*.json ./apps/backend/
COPY apps/frontend/package*.json apps/frontend/tsconfig*.json apps/frontend/vite.config.ts ./apps/frontend/

# 2. Cài đặt dependencies
RUN npm ci

# 3. Sao chép mã nguồn các module
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
COPY apps/frontend ./apps/frontend

# 4. Build toàn bộ (shared, backend, frontend)
RUN npm run build --workspaces

# --- RUNNER STAGE ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Cài đặt ffmpeg để hỗ trợ quét độ dài video tự động trong Docker
RUN apk add --no-cache ffmpeg

# Sao chép mã nguồn đã build & dependencies từ builder
COPY --from=builder /app ./

# Đảm bảo thư mục uploads tồn tại
RUN mkdir -p /app/apps/backend/uploads/videos /app/apps/backend/uploads/contest_videos

EXPOSE 4000

CMD ["node", "apps/backend/dist/server.js"]
