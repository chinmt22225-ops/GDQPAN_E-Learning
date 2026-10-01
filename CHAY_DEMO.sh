#!/bin/bash
echo "===================================================================="
echo "  KHỞI ĐỘNG HỆ THỐNG E-LEARNING GDQP&AN (BẢN DEMO FULLSTACK)"
echo "===================================================================="
echo ""

# 1. Kiểm tra Docker
if command -v docker &> /dev/null; then
    echo "[1/3] Khởi động MongoDB và Redis qua Docker..."
    docker compose up -d mongodb redis
else
    echo "[INFO] Sử dụng MongoDB/Redis cài đặt cục bộ..."
fi

# 2. Kiểm tra build
if [ ! -f "apps/frontend/dist/index.html" ]; then
    echo "[BUILD] Đang build toàn bộ hệ thống..."
    npm run build
else
    echo "[OK] Bản build Frontend và Backend đã sẵn sàng!"
fi

# 3. Khởi chạy
echo ""
echo "===================================================================="
echo "  HỆ THỐNG ĐANG CHẠY TẠI: http://localhost:4000"
echo "  * TÀI KHOẢN ADMIN:     ADMIN01    / Admin@123456"
echo "  * TÀI KHOẢN SINH VIÊN: SV2026001  / Sinhvien@123"
echo "===================================================================="
echo ""

# Tự động mở trình duyệt (hỗ trợ macOS / Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    (sleep 2 && open http://localhost:4000) &
elif command -v xdg-open &> /dev/null; then
    (sleep 2 && xdg-open http://localhost:4000) &
fi

node apps/backend/dist/server.js
