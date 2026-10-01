@echo off
chcp 65001 > nul
cls
echo ====================================================================
echo   DỪNG HỆ THỐNG DEMO E-LEARNING GDQP&AN
echo ====================================================================
echo.
echo Đang tắt tiến trình Server Node.js (cổng 4000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4000') do taskkill /F /PID %%a >nul 2>&1

echo Đang dừng các container Docker (nếu có)...
docker compose stop >nul 2>&1

echo.
echo [HOÀN TẤT] Hệ thống đã được dừng an toàn.
timeout /t 3
