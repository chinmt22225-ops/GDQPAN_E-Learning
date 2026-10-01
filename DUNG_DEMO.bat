@echo off
chcp 65001 > nul
cd /d "%~dp0"
cls
echo ====================================================================
echo   DUNG HE THONG DEMO E-LEARNING GDQP-AN
echo ====================================================================
echo.
echo Dang tat tien trinh Server tai cong 4000...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo Dang dung cac container Docker (neu co)...
docker compose stop >nul 2>&1

echo.
echo [HOAN TAT] He thong da duoc dung an toan.
ping 127.0.0.1 -n 3 >nul
