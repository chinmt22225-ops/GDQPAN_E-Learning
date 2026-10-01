# ====================================================================
# DOCKERFILE CHO PHIÊN BẢN GỘP FULLSTACK E-LEARNING GDQP&AN
# ====================================================================

# GIAI ĐOẠN 1: Build mã nguồn (Frontend + Backend + Shared)
FROM node:20-alpine AS builder

WORKDIR /app

# Sao chép manifest các packages
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
COPY tsconfig.base.json ./
COPY packages/shared/tsconfig.json ./packages/shared/
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/frontend/tsconfig*.json ./apps/frontend/
COPY apps/frontend/vite.config.ts ./apps/frontend/

# Cài đặt toàn bộ dependencies để build
RUN npm ci

# Sao chép mã nguồn
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
COPY apps/frontend ./apps/frontend

# Biên dịch toàn bộ các workspace
RUN npm run build --workspaces

# GIAI ĐOẠN 2: Runner phục vụ môi trường Production / Demo
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Cài đặt dependencies production
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/

RUN npm ci --omit=dev

# Sao chép artifacts đã build
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/frontend/dist ./apps/frontend/dist

# Tạo sẵn thư mục lưu trữ video bài giảng
RUN mkdir -p /app/apps/backend/uploads/videos /app/apps/backend/uploads/contest_videos

EXPOSE 4000

CMD ["node", "apps/backend/dist/server.js"]
