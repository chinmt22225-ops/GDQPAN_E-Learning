# E-Learning Trung tâm GDQP&AN

## Chức năng
- Xác thực MSSV, họ tên, email.
- Video hạn chế tua và gửi heartbeat tiến độ về server.
- Chỉ mở bài kiểm tra sau khi server ghi nhận >=95% thời lượng xem và tiến độ >=90% video.
- Ngân hàng câu hỏi MongoDB; mỗi lượt lấy ngẫu nhiên 10 câu; đáp án đúng chỉ ở server/database.
- Chấm tự động; mặc định đạt từ 8/10.
- Lưu điểm cao nhất, số lần làm, trạng thái ĐẠT/CHƯA ĐẠT.
- Trang quản trị có đăng nhập, tìm kiếm, lọc và xuất Excel.

## Cài đặt
1. Cài Node.js LTS và MongoDB.
2. Mở thư mục dự án, chạy `npm install`.
3. Sao chép `.env.example` thành `.env`, đổi JWT_SECRET và ADMIN_PASSWORD.
4. Chép video bài giảng thành `public/video.mp4`.
5. Chạy `node seed.js` để tạo dữ liệu câu hỏi mẫu, sau đó thay câu hỏi/đáp án bằng dữ liệu chính thức.
6. Chạy `npm start`.
7. Sinh viên: `http://localhost:3000`; quản trị: `http://localhost:3000/admin`.

## Triển khai thật
- Dùng HTTPS và reverse proxy (Nginx/Caddy).
- MongoDB nên bật xác thực, backup định kỳ và không mở cổng DB công khai.
- Đổi mật khẩu quản trị mạnh; tốt hơn nữa lưu ADMIN_PASSWORD dưới dạng bcrypt hash.
- Không coi JavaScript chống tua là cơ chế giám sát tuyệt đối; heartbeat server chỉ tăng độ tin cậy, không chứng minh người học thực sự chú ý.
- Với tải đồng thời lớn, IT cần load-test theo hạ tầng thực tế; con số 5.000 tài khoản không đồng nghĩa 5.000 kết nối video đồng thời. Video nên phục vụ qua object storage/CDN thay vì Node nếu có nhiều người xem cùng lúc.
