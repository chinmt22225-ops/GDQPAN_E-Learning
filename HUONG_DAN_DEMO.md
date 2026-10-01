# 🎓 HƯỚNG DẪN KHỞI CHẠY & DEMO HỆ THỐNG E-LEARNING GDQP&AN
### *Phiên bản Đóng gói Gộp Toàn diện (Unified Fullstack Demo)*

---

## 🌟 1. Tổng quan phiên bản Demo
Hệ thống **E-Learning & Khảo thí Trực tuyến GDQP&AN** đã được đóng gói gộp hoàn chỉnh giữa **Backend (Node.js/Express)** và **Frontend (React/Vite)** thành một khối dịch vụ duy nhất:
* **Chạy trên 1 cổng duy nhất:** `http://localhost:4000` (không còn xung đột CORS, không cần mở nhiều cửa sổ terminal).
* **Trải nghiệm Plug & Play:** Khách hàng hoặc người thuyết trình chỉ cần nhấp đúp **1-Click** là hệ thống tự khởi động và tự động mở trình duyệt web.
* **Đầy đủ dữ liệu mẫu:** Tích hợp sẵn tài khoản Admin, tài khoản Sinh viên và các bài giảng thực tế đã được nạp sẵn.

---

## 🚀 2. Cách khởi chạy nhanh (3 lựa chọn)

### Lựa chọn 1: Khởi động 1-Click trên Windows *(Khuyên dùng)*
1. Vào thư mục gốc của dự án: `d:\GDQPAN\elearning-trungtam`
2. Nhấp đúp chuột vào file:
   👉 **`CHAY_DEMO.bat`**
3. Hệ thống sẽ tự động kiểm tra cơ sở dữ liệu, khởi động server và mở trình duyệt web đến địa chỉ:
   `http://localhost:4000`

> **Để dừng hệ thống:** Nhấp đúp vào file **`DUNG_DEMO.bat`** (hoặc nhấn tổ hợp phím `Ctrl + C` tại cửa sổ đang chạy).

---

### Lựa chọn 2: Khởi động bằng dòng lệnh Node.js
Mở PowerShell hoặc Command Prompt tại thư mục dự án và chạy:
```bash
# Khởi động server gộp ngay lập tức:
npm run demo
```
Truy cập vào trình duyệt: `http://localhost:4000`

---

### Lựa chọn 3: Khởi động qua Docker Compose (Mọi nền tảng)
Dành cho máy khách hàng muốn chạy hoàn toàn độc lập trong container mà không cần cài môi trường Node.js:
```bash
docker compose -f docker-compose.demo.yml up -d --build
```
Dừng Docker:
```bash
docker compose -f docker-compose.demo.yml down
```

---

## 🔑 3. Thông tin tài khoản Demo có sẵn

| Vai trò | Tên đăng nhập / MSSV / Email | Mật khẩu | Quyền hạn & Chức năng |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `ADMIN01`<br>*(hoặc admin@gdqpan.edu.vn)* | `Admin@123456` | Quản lý khóa học, bài học, tải video lên, ngân hàng câu hỏi trắc nghiệm, quản lý sinh viên và thống kê điểm |
| **Sinh viên mẫu (Student)** | `SV2026001`<br>*(hoặc sinhvien@gdqpan.edu.vn)* | `Sinhvien@123` | Vào học video bài giảng, thanh tiến độ chống tua, làm bài thi trắc nghiệm, nhận kết quả và nâng điểm |

---

## 📋 4. Kịch bản trình diễn (Demo Flow) cho khách hàng

### Kịch bản 1: Trải nghiệm Sinh viên học tập & Khảo thí (5 phút)
1. Truy cập `http://localhost:4000` và đăng nhập với tài khoản:
   * Tên đăng nhập: `SV2026001` | Mật khẩu: `Sinhvien@123`
2. Tại trang chủ **Khóa học**, bấm vào học phần **Giáo Dục Quốc Phòng & An Ninh**.
3. **Trải nghiệm học Video:**
   * Giao diện bài học phong cách Khan Academy trực quan, hiện đại.
   * **Cơ chế chống tua lướt:** Thử kéo thanh trượt video vượt qua đoạn chưa xem -> Hệ thống sẽ cảnh báo và kéo người học về mốc đã xem hợp lệ.
   * **Tính năng Reset tiến độ:** Nếu học viên muốn học lại từ đầu, bấm nút `↺ Xem lại từ đầu (Reset 0%)` để làm mới phiên học.
   * **Nhịp tim nhặt block:** Xem liên tục, thanh tiến độ % sẽ tăng dần dựa trên thời lượng video thực tế mà không cần nhập thủ công.
4. **Làm bài kiểm tra trắc nghiệm:**
   * Sau khi xem đủ thời lượng yêu cầu (hoặc bài học đã mở khóa), chuyển sang tab **"2. Làm Bài Kiểm Tra"**.
   * Trả lời các câu hỏi trắc nghiệm, nộp bài.
   * Hệ thống tự động chấm điểm tức thì, phản hồi ĐẠT / CHƯA ĐẠT và hiển thị giải thích chi tiết cho từng câu hỏi.

---

### Kịch bản 2: Trải nghiệm Quản trị viên (Admin Portal) (5 phút)
1. Đăng xuất tài khoản sinh viên, đăng nhập bằng:
   * Tên đăng nhập: `ADMIN01` | Mật khẩu: `Admin@123456`
2. **Tổng quan (Dashboard):**
   * Theo dõi biểu đồ số lượng sinh viên, bài giảng, tỷ lệ hoàn thành học phần.
3. **Quản lý bài giảng & Video:**
   * Vào mục **Quản lý khóa học** -> chọn danh sách bài học.
   * Bấm **Tải video lên**: Tải video MP4 bất kỳ lên máy chủ.
   * Hệ thống tự động kích hoạt tính năng **quét độ dài video tự động (ffprobe)** để tính thời lượng chính xác từng giây, tính toán % tiến độ hoàn toàn tự động.
4. **Quản lý ngân hàng câu hỏi:**
   * Thêm mới câu hỏi, chỉnh sửa đáp án, cấu hình điểm chuẩn Đạt (ví dụ 8/10 điểm).
5. **Quản lý sinh viên & Điểm thi:**
   * Xem danh sách sinh viên tham gia học, điểm thi cao nhất, thời gian hoàn thành.
   * Tùy chọn xuất danh sách ra bảng tính Excel chuẩn Bộ GD&ĐT.

---

## 🛠️ 5. Cấu trúc đóng gói kỹ thuật
```
elearning-trungtam/
├── CHAY_DEMO.bat          # File chạy 1-Click trên Windows
├── DUNG_DEMO.bat          # File dừng hệ thống trên Windows
├── CHAY_DEMO.sh           # File chạy trên Linux/macOS
├── Dockerfile             # Đóng gói Fullstack đa tầng (Multi-stage)
├── docker-compose.demo.yml# Triển khai trọn gói Container độc lập
├── HUONG_DAN_DEMO.md      # Tài liệu hướng dẫn sử dụng demo
├── apps/
│   ├── backend/dist/      # Backend Node.js đã build phục vụ API + Static SPA
│   ├── backend/uploads/   # Thư mục lưu trữ video bài giảng thực tế
│   └── frontend/dist/     # Frontend React SPA đã tối ưu hóa build
└── packages/shared/dist/  # Các schema và kiểu dữ liệu dùng chung
```

---
*Chúc buổi demo tới khách hàng thành công tốt đẹp!*
