@echo off
chcp 65001 > nul
cls
echo ====================================================================
echo   ĐÓNG GÓI BẢN DEMO DOCKER GỬI KHÁCH HÀNG (TỰ ĐỘNG LỌC FILE RÁC)
echo ====================================================================
echo.
echo Đang nén các tệp cần thiết (loại bỏ node_modules và .git để dung lượng siêu nhẹ)...
echo Vui lòng chờ trong giây lát...
echo.

powershell -NoProfile -Command ^
  "$dest = '..\gdqpan-demo-docker.zip'; " ^
  "if (Test-Path $dest) { Remove-Item $dest -Force }; " ^
  "$exclude = @('node_modules', '.git', '.github', '*.log'); " ^
  "$items = Get-ChildItem -Path . -Exclude 'node_modules', '.git' | Where-Object { $_.Name -notin @('node_modules', '.git') }; " ^
  "Compress-Archive -Path $items -DestinationPath $dest -CompressionLevel Optimal; " ^
  "Write-Host '[HOÀN THÀNH] Đã tạo file nén thành công tại:' (Resolve-Path $dest)"

echo.
echo ====================================================================
echo  FILE NÉN ĐÃ ĐƯỢC TẠO XONG: gdqpan-demo-docker.zip (Ở thư mục cha)
echo  Bạn chỉ cần gửi file này cho khách hàng!
echo ====================================================================
echo.
pause
