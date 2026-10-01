@echo off
chcp 65001 > nul
cd /d "%~dp0"
cls

echo ====================================================================
echo   KHOI DONG HE THONG E-LEARNING GDQP-AN (BAN DEMO FULLSTACK)
echo ====================================================================
echo.

:: 1. Kiem tra Docker va khoi chay Database neu co
echo [1/3] Kiem tra co so du lieu (MongoDB, Redis)...
docker info >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Docker dang hoat dong. Khoi dong MongoDB va Redis...
    docker compose up -d mongodb redis >nul 2>&1
) else (
    echo [INFO] Docker chua bat. Su dung MongoDB va Redis cuc bo...
)

:: 2. Giai phong cong 4000 neu dang bi chiem
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: 3. Kiem tra ban build Frontend va Backend
echo [2/3] Kiem tra goi dong goi ung dung...
if not exist "apps\frontend\dist\index.html" (
    echo [BUILD] Dang bien dich ma nguon lan dau...
    call npm run build
) else (
    echo [OK] Ban build Frontend va Backend da san sang!
)

:: 4. Khoi chay Server Fullstack
echo [3/3] Dang khoi chay Server tai cong 4000...
echo.
echo ====================================================================
echo   HE THONG DANG CHAY TAI: http://localhost:4000
echo.
echo   * TAI KHOAN ADMIN:     ADMIN01    / Admin@123456
echo   * TAI KHOAN SINH VIEN: SV2026001  / Sinhvien@123
echo ====================================================================
echo.
echo [TU DONG] Mo trinh duyet web sau 3 giay...
powershell -NoProfile -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:4000'" >nul 2>&1 &

echo.
echo Nhap Ctrl + C de dung he thong bat cu luc nao.
echo.
node apps/backend/dist/server.js
pause
