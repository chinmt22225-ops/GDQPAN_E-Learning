@echo off
chcp 65001 > nul
cls
echo ====================================================================
echo   KHỞI ĐỘNG HỆ THỐNG E-LEARNING GDQP&AN (BẢN DEMO FULLSTACK GỘP CỔNG)
echo ====================================================================
echo.

:: 1. Kiểm tra Docker và khởi chạy Database nếu cần
echo [1/3] Kiểm tra các dịch vụ cơ sở dữ liệu (MongoDB, Redis)...
docker info >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Docker đang hoạt động. Khởi động MongoDB và Redis...
    docker compose up -d mongodb redis >nul 2>&1
) else (
    echo [INFO] Docker chưa bật hoặc không có sẵn. Sử dụng dịch vụ MongoDB/Redis nội bộ...
)

:: 2. Kiểm tra bản build Frontend và Backend
echo [2/3] Kiểm tra gói đóng gói ứng dụng (Frontend + Backend)...
if not exist "apps\frontend\dist\index.html" (
    echo [BUILD] Chưa có bản build Frontend. Đang build toàn bộ hệ thống...
    call npm run build
) else (
    echo [OK] Bản build Frontend và Backend đã sẵn sàng!
)

:: 3. Dọn dẹp cổng 4000 nếu đang bị chiếm
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4000') do taskkill /F /PID %%a >nul 2>&1

:: 4. Khởi chạy Server gộp Fullstack
echo [3/3] Đang khởi chạy Server Fullstack tại cổng 4000...
echo.
echo ====================================================================
echo   HỆ THỐNG ĐANG CHẠY TẠI: http://localhost:4000
echo.
echo   * TÀI KHOẢN ADMIN:     ADMIN01    / Admin@123456
echo   * TÀI KHOẢN SINH VIÊN: SV2026001  / Sinhvien@123
echo ====================================================================
echo.
echo [TỰ ĐỘNG] Mở trình duyệt web sau 3 giây...
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:4000"

echo.
echo Nhấn Ctrl + C để dừng hệ thống bất cứ lúc nào.
echo.
node apps/backend/dist/server.js
pause
