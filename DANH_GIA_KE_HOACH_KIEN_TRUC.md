# 🔍 BÁO CÁO ĐÁNH GIÁ KẾ HOẠCH KIẾN TRÚC E-LEARNING GDQP&AN

> **Tài liệu được đánh giá:** `KE_HOACH_KIEN_TRUC.md` v1.0 (29/09/2026)
> **Ngày đánh giá:** 29/09/2026
> **Góc nhìn:** Kỹ sư Full-stack (kiến trúc, bảo mật, hiệu năng, vận hành) + Tester chuyên nghiệp (khả năng kiểm thử, rủi ro chất lượng, kịch bản lỗi)
> **Phạm vi:** Chỉ đánh giá nội dung tài liệu kế hoạch. Chưa xem mã nguồn cũ (`elearning-trungtam`) và bản thiết kế Stitch, nên các nhận xét về "tương thích code cũ" và UI chưa được kiểm chứng.

**Chú giải mức độ:** 🔴 Nghiêm trọng (phải sửa trước khi code) · 🟠 Cao · 🟡 Trung bình · 🟢 Thấp / cải tiến

---

## 0. KẾT LUẬN ĐIỀU HÀNH

**Nhận định chung:** Hướng đi đúng và có tư duy tốt (tách video khỏi VPS, chấm điểm ở server, heartbeat để kiểm soát tiến độ xem). Tuy nhiên tài liệu mới ở mức **bản phác thảo ý tưởng**, chưa đủ để bắt đầu xây dựng production. Có nhiều lỗ hổng về **danh tính người dùng, tính toàn vẹn của bài thi, chống gian lận tiến độ xem, vận hành và kiểm thử**.

| Hạng mục | Điểm (/10) | Nhận xét ngắn |
|---|:---:|---|
| Tổng quan & lựa chọn công nghệ | 6 | Hợp lý nhưng có phiên bản đã hết hỗ trợ và vài lựa chọn chưa cần thiết |
| Thiết kế dữ liệu | 5.5 | Thiếu index/ràng buộc quan trọng, đặt tên gây nhầm, thiếu thực thể |
| Luồng nghiệp vụ | 6 | Rõ luồng chính, thiếu luồng ngoại lệ và quy tắc nghiệp vụ |
| Bảo mật | 4.5 | Nhiều điểm yếu về đăng ký, phiên, chống gian lận |
| Hiệu năng & mở rộng | 5 | Tuyên bố "mượt mà" chưa có số liệu, VPS đơn là điểm chết duy nhất |
| Vận hành (backup, giám sát, CI/CD) | 3 | Gần như chưa được đề cập |
| Khả năng kiểm thử | 2.5 | Không có chiến lược test, tiêu chí nghiệm thu, NFR |
| Tính đầy đủ tài liệu | 5 | Thiếu API contract, mâu thuẫn nội bộ, chưa có tiến độ |
| **Tổng thể** | **~5/10** | **Đủ làm nền, chưa đủ để bắt đầu code. Cần một vòng chỉnh sửa (mục 9).** |

### 10 vấn đề phải xử lý trước khi viết code

| # | Mã | Vấn đề | Mức |
|---|---|---|:---:|
| 1 | SEC-01 | Sinh viên **tự đăng ký** bằng MSSV tự khai: giả mạo danh tính, xung đột với luồng Admin import danh sách | 🔴 |
| 2 | QZ-01 | Server không lưu **bộ đề đã phát** cho từng lượt thi: có thể nộp câu hỏi tùy ý, vét ngân hàng đề | 🔴 |
| 3 | VID-01 | Heartbeat chỉ gửi `currentTime`: dễ giả mạo, chạy nhiều tab/thiết bị song song, tua tốc độ 2x | 🔴 |
| 4 | ARCH-01 | **Next.js 14 đã hết hỗ trợ bảo mật** (EOL 26/10/2025), Next 15 sẽ EOL 21/10/2026 | 🔴 |
| 5 | VID-04 | Presigned URL **không chống tải lậu** như tài liệu tuyên bố, và mâu thuẫn với việc dùng CDN | 🟠 |
| 6 | SEC-05 | `bcryptjs` (JS thuần) chặn event loop khi hàng nghìn sinh viên đăng nhập cùng lúc | 🟠 |
| 7 | OPS-01 | Không có backup/DR/giám sát; MongoDB chạy chung VPS, chưa nói đến replica set | 🟠 |
| 8 | TEST-01 | Không có chiến lược kiểm thử, NFR, tiêu chí nghiệm thu | 🟠 |
| 9 | DATA-01 | Thiếu unique index `(userId, courseId)`, đặt tên `studentId` trùng nghĩa giữa 2 collection | 🟠 |
| 10 | DOC-01 | Không có API contract; nhiều quyết định còn "hoặc/hoặc" (SSE hay WebSocket, R2 hay S3) | 🟡 |

---

## 1. ĐIỂM MẠNH CỦA KẾ HOẠCH

1. **Tách video khỏi VPS** (R2/S3 + CDN) đúng hướng: băng thông video là thứ giết VPS đầu tiên. Ví dụ 2.000 người xem đồng thời ở ~2 Mbps ≈ 4 Gbps, VPS đơn không thể gánh.
2. **Chấm điểm phía server**, đáp án `correct` không bao giờ gửi xuống client: đúng nguyên tắc.
3. **Cơ chế heartbeat + kiểm tra khoảng thời gian giữa hai lần** cho thấy đã nghĩ đến gian lận tiến độ, không chỉ tin vào client.
4. **HTTP-Only cookie** cho JWT thay vì `localStorage`: giảm rủi ro đánh cắp token qua XSS.
5. **Module hóa backend** (controllers/services/middleware/models) rõ ràng, có `sseService`, `quizScoringService` tách riêng, dễ viết unit test.
6. **Có nghĩ đến import/export Excel, phân trang, tìm kiếm, lọc trạng thái**: sát nhu cầu vận hành thực tế của trung tâm.
7. **Mở khóa bài thi theo điều kiện xem video** phù hợp mục tiêu sư phạm của môn GDQP&AN.
8. **Chọn TypeScript** ở cả hai đầu: giảm lỗi, thuận lợi chia sẻ kiểu dữ liệu.

---

## 2. ĐÁNH GIÁ CHI TIẾT

### 2.1. Kiến trúc tổng thể & công nghệ

| Mã | Mức | Phát hiện | Đề xuất |
|---|:---:|---|---|
| **ARCH-01** | 🔴 | **Next.js 14** đã hết vòng đời (EOL 26/10/2025), không còn nhận bản vá bảo mật; nhiều CVE mới chỉ được vá từ Next 15/16. Next 15 cũng sẽ EOL 21/10/2026, tức chỉ vài tuần nữa. Kế hoạch còn ghi React 18. | Chọn **Next.js 16 (Active LTS)** hoặc bỏ Next (xem ARCH-02). Ghim phiên bản Node LTS, bật Dependabot/Renovate. |
| **ARCH-02** | 🟡 | Lý do chọn Next.js là "tối ưu SEO/SSR/SSG", nhưng hệ thống **nằm sau đăng nhập**, hầu như không cần SEO. Next tạo thêm một tiến trình Node (port 3000) tốn RAM trên VPS chung và mở rộng bề mặt tấn công (SSR, middleware). | Cân nhắc **SPA (Vite + React + React Router)** build tĩnh, Nginx phục vụ trực tiếp: đơn giản hơn, nhẹ hơn, ít điểm hỏng. Chỉ giữ Next nếu có lý do rõ (đội đã quen, cần trang công khai). |
| **ARCH-03** | 🟠 | **Điểm chết duy nhất (SPOF):** Nginx, Next, Express, MongoDB cùng một VPS. Node/Next tranh RAM với MongoDB (WiredTiger chiếm ~50% RAM). Một sự cố = toàn hệ thống ngừng, đúng vào ngày hạn chót học. | Tối thiểu: tách MongoDB sang máy/managed riêng hoặc giới hạn cache; dựng **replica set** (xem OPS-02). Kế hoạch dự phòng (runbook) khi VPS chết. |
| **ARCH-04** | 🟡 | Mâu thuẫn "Server nội bộ (VPS/On-premise)": nội bộ (mạng trường) hay VPS công cộng? Điều này quyết định TLS, truy cập từ ngoài, DDoS, băng thông đường lên. | Chốt rõ mô hình. Nếu on-premise: cần IP công cộng/VPN/reverse tunnel; Certbot HTTP-01 sẽ không chạy nếu không mở cổng 80 ra internet (dùng DNS-01 hoặc CA nội bộ). |
| **ARCH-05** | 🟡 | Chưa quyết: **R2 hay S3**, **SSE hay WebSocket**. Hai lựa chọn khác nhau về chi phí, SDK, cách ký URL, cách mở rộng. | Chốt trong tài liệu (khuyến nghị: R2 + SSE, lý do ở 2.3 và 2.6). Ghi thành ADR (Architecture Decision Record). |
| **ARCH-06** | 🟡 | Chọn **MongoDB**: dữ liệu ở đây khá **quan hệ** (user ↔ course ↔ enrollment ↔ attempt) và nhu cầu báo cáo/lọc/xuất Excel nhiều. Mongo vẫn làm được, nhưng PostgreSQL thường hợp hơn cho ràng buộc, join, báo cáo, giao dịch. | Không phải lỗi. Nếu giữ Mongo: phải dùng replica set, index kỹ, và chấp nhận tự đảm bảo ràng buộc ở tầng ứng dụng. Ghi rõ lý do chọn. |
| **ARCH-07** | 🟢 | "Tương thích tốt với code cũ" chưa có bằng chứng (chưa biết code cũ là gì). | Kiểm kê code cũ: phần nào tái sử dụng, phần nào bỏ. |
| **ARCH-08** | 🟢 | Tham chiếu thiết kế "phong cách Khan Academy". | Chỉ lấy cảm hứng bố cục, không sao chép logo, hình ảnh, tên thương hiệu. |
| **ARCH-09** | 🟢 | Cấu trúc thư mục 2 repo/2 thư mục rời, mỗi bên tự định nghĩa kiểu dữ liệu, dễ lệch. | Dùng **monorepo** (pnpm workspaces) với package `shared` chứa schema **zod**/kiểu chung cho API. Bổ sung `tests/`, `validators/`, `jobs/`, `scripts/` (seed, migration), `.env.example`, `docker-compose.yml`, `docs/`. |

### 2.2. Bảo mật & xác thực

| Mã | Mức | Phát hiện | Đề xuất |
|---|:---:|---|---|
| **SEC-01** | 🔴 | Luồng 4.1 cho sinh viên **tự đăng ký** bằng MSSV, họ tên, email, mật khẩu, trong khi 4.2 lại cho Admin **import danh sách sinh viên**. Hai luồng mâu thuẫn. Nếu ai cũng đăng ký được: chiếm MSSV của bạn khác, học/thi hộ, rác dữ liệu, kết quả sai lệch. | Bỏ đăng ký tự do. Admin import danh sách (MSSV, họ tên, lớp, email) → sinh viên **kích hoạt tài khoản** bằng link/OTP gửi vào email trường (hoặc mật khẩu khởi tạo bắt buộc đổi lần đầu). Nếu có SSO của trường/ĐHQG thì ưu tiên. |
| **SEC-02** | 🟠 | Tài liệu nói JWT + cookie "chống XSS/CSRF". HttpOnly chỉ giảm rủi ro XSS **đánh cắp token**, **không chống CSRF**. | `SameSite=Lax/Strict`, `Secure`, kiểm tra `Origin`, thêm CSRF token cho các request thay đổi dữ liệu. CSP nghiêm ngặt phía frontend. |
| **SEC-03** | 🟠 | JWT stateless **không thu hồi được**: khóa tài khoản (`isActive=false`), đổi mật khẩu, phát hiện gian lận không có hiệu lực ngay. Chưa có refresh token, đăng xuất, quản lý phiên. | Access token ngắn (10-15 phút) + refresh token **xoay vòng** lưu DB/Redis (có thể thu hồi). Collection `sessions`. |
| **SEC-04** | 🟠 | Không có chính sách **một phiên hoạt động**: một sinh viên đưa tài khoản cho người khác học/thi, hoặc mở nhiều thiết bị để nhân đôi tiến độ. | Giới hạn số phiên đồng thời (1-2), cảnh báo/đá phiên cũ, ghi log IP/User-Agent. |
| **SEC-05** | 🟠 | `bcryptjs` là bản JS thuần, tính băm trên **event loop**. Khi 5.000 sinh viên đăng nhập gần đồng thời (đầu buổi/hạn chót), API bị nghẽn cho mọi người dùng, kể cả heartbeat. | Dùng `bcrypt` (native, chạy thread pool) hoặc **argon2id**; đặt cost hợp lý; giới hạn tốc độ đăng nhập; chạy nhiều worker (PM2 cluster). Load test riêng kịch bản đăng nhập đồng loạt. |
| **SEC-06** | 🟠 | **Chưa có phân quyền chi tiết**: chỉ có enum `student/admin/superadmin`. Ai được xóa sinh viên, sửa điểm, xuất báo cáo, xem đáp án? Không có **audit log**. | Ma trận quyền (RBAC), middleware kiểm tra theo quyền chứ không chỉ theo vai trò. `audit_logs` cho mọi thao tác admin nhạy cảm (import, sửa/xóa điểm, xuất dữ liệu). **MFA** cho admin/superadmin. |
| **SEC-07** | 🟠 | Không có kế hoạch **quên mật khẩu / đổi mật khẩu / mật khẩu khởi tạo**. Nếu dùng MSSV làm mật khẩu mặc định thì cực yếu. | Thiết kế luồng đặt/lại mật khẩu (email, token dùng một lần, hết hạn), chính sách độ mạnh mật khẩu, khóa tạm sau N lần sai. |
| **SEC-08** | 🟡 | `rateLimiter` chỉ được nhắc tên. Chưa nói giới hạn ở đâu, mức nào. | Giới hạn theo IP **và** theo tài khoản: đăng nhập, heartbeat, lấy đề, nộp bài, import. Tầng Nginx + tầng ứng dụng. |
| **SEC-09** | 🟡 | Chưa có kiểm soát đầu vào: NoSQL injection (`{ "$ne": null }` trong body/query), mass assignment, XSS trong nội dung câu hỏi/tên. | Validate mọi request bằng zod; `express-mongo-sanitize`; chỉ nhận các trường whitelist; `helmet`; escape/sanitize nội dung hiển thị. |
| **SEC-10** | 🟡 | Quản lý bí mật (khóa R2/S3, JWT secret, mật khẩu DB) chưa được nêu. | `.env` ngoài git, phân quyền tối thiểu cho khóa R2 (chỉ bucket cần thiết), xoay khóa định kỳ, quét bí mật trong CI. |
| **SEC-11** | 🟡 | **Excel injection** khi xuất báo cáo: ô bắt đầu bằng `=`, `+`, `-`, `@` (do dữ liệu người dùng nhập) có thể thực thi công thức khi mở bằng Excel. | Tiền tố `'` hoặc làm sạch các ô văn bản khi xuất. |
| **SEC-12** | 🟡 | Gói `xlsx` (SheetJS) trên npm registry ngừng ở phiên bản 0.18.5 và có lỗ hổng đã công bố (theo hiểu biết của mình: prototype pollution, ReDoS); bản mới do SheetJS phát hành qua kênh riêng. Cần kiểm tra lại khi chọn. | Ưu tiên **ExcelJS**, hoặc cài SheetJS từ nguồn chính thức; giới hạn kích thước/số dòng file import; chạy `npm audit` trong CI. |

### 2.3. Video, lưu trữ & chống gian lận tiến độ

| Mã | Mức | Phát hiện | Đề xuất |
|---|:---:|---|---|
| **VID-01** | 🔴 | Heartbeat chỉ gửi `{ currentTime }`. Client tự khai `currentTime`, nên: (a) một script gửi heartbeat mà không phát video; (b) mở **nhiều tab/thiết bị** cùng gửi heartbeat cho nhiều bài; (c) **tăng tốc 2x-16x** vẫn được tính đủ thời gian nếu server chỉ cộng theo chênh lệch `currentTime`; (d) heartbeat khi video đang **pause** hoặc tab bị ẩn. | Server dùng **đồng hồ của server** làm chuẩn: `watchedDelta ≤ (now − lastHeartbeatAt)` và `≤ playbackRate × elapsed` (khóa tốc độ ≤ 1x). Heartbeat gửi thêm `sessionId`, `seq`, `playing`, `playbackRate`, `visibility`. **Một phiên xem hoạt động/sinh viên**: heartbeat từ phiên thứ hai bị từ chối hoặc không cộng. |
| **VID-02** | 🟠 | Tính tiến độ bằng **tổng giây tích lũy** (`watchedSeconds`) cộng với `maxSecond`. Tua lại xem đi xem lại làm `watchedSeconds` phình lên mà vẫn chưa xem hết. Hai ngưỡng 95% và 90% chồng chéo, khó giải thích và khó test. Tên `minSeekPercent` gây khó hiểu. | Theo dõi **vùng đã xem duy nhất** (bitmap theo khối 5-10 giây). Điều kiện hoàn thành = tỉ lệ phủ ≥ ngưỡng (một ngưỡng duy nhất, cấu hình được). Bỏ `maxSecond`-là-điều-kiện, chỉ dùng cho việc chặn tua/resume. |
| **VID-03** | 🟠 | **Khóa tua chỉ ở client** là rào cản UX, không phải kiểm soát an ninh (gỡ được bằng DevTools). Việc kiểm soát thật sự nằm ở server (VID-01/02), điều này tài liệu chưa nói rõ. Trên **iOS Safari**, video có thể chuyển sang trình phát gốc khi bấm toàn màn hình, gây lệch với custom player. | Ghi rõ nguyên tắc: *client chỉ hỗ trợ UX, server quyết định*. Dùng `playsinline`, lắng nghe sự kiện `seeking`/`ratechange` để hoàn tác. **Test bắt buộc trên iOS Safari, Android Chrome, Zalo in-app browser.** |
| **VID-04** | 🟠 | Tài liệu nói presigned URL "chống download lậu". Sai: bất kỳ ai có URL (kể cả copy từ DevTools) **tải được toàn bộ file trong thời hạn hiệu lực** và có thể chia sẻ. Ngoài ra, theo tài liệu Cloudflare hiện hành, presigned URL của R2 được ký cho **endpoint S3 API** (`<account>.r2.cloudflarestorage.com`), không phải domain tùy chỉnh phía CDN; vì vậy lợi ích "CDN cache" ở tài liệu chưa chắc đạt được nếu dùng presigned URL. | Chấp nhận có thể tải lậu, hoặc nâng cấp: **HLS** (m3u8 + segment) với khóa AES-128, token ký HMAC kiểm tra tại Cloudflare Worker/WAF trên domain video riêng (có cache), hoặc dùng dịch vụ video có DRM/token (Cloudflare Stream, Bunny Stream). Quyết định theo mức nhạy cảm của nội dung. |
| **VID-05** | 🟠 | **Không có quy trình xử lý video (transcode).** File mp4 tải lên nguyên bản: dung lượng lớn, bitrate cao, sinh viên dùng 4G sẽ giật; mp4 không `faststart` không seek tốt; không có nhiều độ phân giải. | Pipeline FFmpeg: H.264/AAC, `+faststart`, tạo 360p/480p/720p, tốt nhất là HLS; ffprobe lấy **thời lượng thực** tự động (bỏ nhập tay `videoDurationSeconds`). Chạy ở job nền, không chạy trong tiến trình API. |
| **VID-06** | 🟡 | Upload qua web "multipart upload lên R2/S3": nếu đi qua Express sẽ tốn RAM/băng thông VPS. Chưa nói giới hạn dung lượng, định dạng, tiếp tục khi mất mạng. | Browser **upload trực tiếp lên R2** bằng multipart presigned; backend chỉ cấp URL và xác nhận hoàn tất; kiểm tra MIME/kích thước; lifecycle rule dọn multipart dở dang; cấu hình CORS bucket đúng origin. |
| **VID-07** | 🟡 | Mất mạng/đóng tab đột ngột: giây cuối chưa được ghi. Kết nối chập chờn vượt ngưỡng 20-30 giây khiến mất tiến độ hợp lệ, sinh viên bực bội. | `navigator.sendBeacon` khi rời trang; dung sai hợp lý; hiển thị trạng thái tiến độ rõ ràng; cho phép tiếp tục từ vị trí đã lưu. |
| **VID-08** | 🟡 | Yêu cầu 95% thời lượng gồm cả đoạn giới thiệu/credit cuối, tạo trải nghiệm khó chịu; không có cơ chế phát hiện sinh viên bỏ mặc video chạy (không xem thật). | Cho phép đặt ngưỡng theo bài; cân nhắc câu hỏi kiểm tra chú ý ngắn giữa video (tùy chọn). |
| **VID-09** | 🟢 | Chưa có phụ đề, tốc độ phát chậm, hỗ trợ người khiếm thị/thính. | Đưa vào yêu cầu phi chức năng (mục 2.11). |

### 2.4. Bài kiểm tra trắc nghiệm

| Mã | Mức | Phát hiện | Đề xuất |
|---|:---:|---|---|
| **QZ-01** | 🔴 | `quiz_attempts` **chỉ ghi khi nộp bài**. Tài liệu không nói server lưu **danh sách câu hỏi đã phát**. Hệ quả: (a) client nộp `questionId` bất kỳ (chọn các câu dễ, hoặc chỉ nộp câu đã biết đáp án); (b) gọi API lấy đề nhiều lần để **vét toàn bộ ngân hàng** rồi trao đổi đáp án; (c) không phát hiện được nộp trùng. | Tách **bắt đầu** và **nộp**: `POST /quiz/start` tạo `attempt` trạng thái `in_progress` với `questionIds[]`, `startedAt`, `expiresAt`; `POST /quiz/:id/submit` chỉ chấp nhận đúng tập câu hỏi đó, một lần duy nhất, trong thời hạn. Chỉ một attempt `in_progress` cho mỗi sinh viên/khóa. |
| **QZ-02** | 🟠 | Không có **giới hạn số lần / thời gian chờ giữa các lần làm lại**. Làm lại vô hạn với đề mới ngẫu nhiên = thử-sai đến khi đạt, đồng thời vét ngân hàng đề. | Quy tắc nghiệp vụ rõ ràng: số lần tối đa hoặc cooldown (vd. 10-15 phút); ưu tiên câu chưa gặp; cảnh báo/ghi log khi vượt ngưỡng bất thường. |
| **QZ-03** | 🟠 | Không quy định **kích thước ngân hàng câu hỏi tối thiểu**. Ngân hàng nhỏ (vd. 20-30 câu) thì mỗi đề gần như giống nhau. Không nói xáo trộn thứ tự câu/đáp án. | Yêu cầu ngân hàng ≥ 3-5 lần số câu/đề; xáo thứ tự câu và đáp án cho từng attempt (lưu ánh xạ để chấm). Cảnh báo admin khi ngân hàng quá nhỏ. |
| **QZ-04** | 🟠 | **Mơ hồ phạm vi bài thi:** mở khóa theo **từng bài học** (`completed` của một lesson) nhưng điểm/đạt lưu ở **mức khóa học** (`enrollments`), `quiz_attempts` không có `lessonId`. Xem xong 1 bài đã được thi cả khóa? Hay thi theo bài? | Chốt: bài thi **cuối khóa** (yêu cầu hoàn thành tất cả bài bắt buộc) hoặc **theo bài** (cần `lessonId` + điểm theo bài). Tài liệu hóa quy tắc đạt môn tổng hợp. |
| **QZ-05** | 🟠 | `questions` sửa/xóa được (CRUD) nhưng `quiz_attempts` chỉ giữ `questionId`. Sửa/xóa câu hỏi sau khi có người làm sẽ **làm sai lịch sử** và không thể tra cứu khiếu nại. | **Soft delete** + **phiên bản hóa** câu hỏi, hoặc lưu snapshot (nội dung câu, đáp án đã chọn/đúng) vào attempt. |
| **QZ-06** | 🟡 | Chưa nói **hiển thị gì sau khi nộp**: có lộ đáp án đúng/giải thích không? Nếu lộ, nguy cơ lan truyền đáp án. | Chính sách rõ: chỉ hiển thị điểm, hoặc hiển thị đáp án sai kèm giải thích ở cuối khóa. |
| **QZ-07** | 🟡 | Nộp bài **trùng lặp / đua nhau** (double click, mạng chậm, 2 tab) có thể tính hai lần hoặc lệch `attemptsCount`. | Chuyển trạng thái attempt **nguyên tử** (`findOneAndUpdate` điều kiện `status: in_progress`), khóa idempotency. |
| **QZ-08** | 🟡 | `passed` có thể bị ghi đè bởi lần thi sau kém hơn? Chưa quy định. Điểm thang 10 với 10 câu/lượt, chưa nói cách làm tròn khi `totalQuestionsPerQuiz` khác 10. | `passed` **đơn điệu** (đã đạt thì giữ đạt), `highestScore` = max; tài liệu hóa công thức điểm. |
| **QZ-09** | 🟡 | Schema `choices` cố định A/B/C/D, một đáp án đúng: không mở rộng được cho nhiều đáp án, đúng/sai, hình ảnh. | Dùng mảng `choices: [{id, text, imageKey?}]` và `correctIds[]`. |
| **QZ-10** | 🟢 | Không có đồng hồ thời gian làm bài, không phát hiện chuyển tab. | Tùy nhu cầu: giới hạn thời gian, ghi nhận mất focus. Cần nêu rõ đây là bài thi có giám sát hay không. |

### 2.5. Thiết kế cơ sở dữ liệu

| Mã | Mức | Phát hiện | Đề xuất |
|---|:---:|---|---|
| **DATA-01** | 🟠 | `enrollments` **không có unique index `(userId, courseId)`**: có thể tạo bản ghi trùng, tiến độ/điểm chia đôi. Mục 3.5 nói `enrollments & lesson_progress` nhưng chỉ có một cấu trúc. | Unique compound index; quyết định gộp hay tách (khuyến nghị tách, xem DATA-03). |
| **DATA-02** | 🟠 | **Đặt tên gây nhầm:** `users.studentId` là **MSSV (String)**, còn `enrollments.studentId` là **ObjectId tham chiếu User**. Rất dễ truy vấn sai. | Đổi: `users.mssv` (hoặc `studentCode`), và mọi tham chiếu là `userId`. |
| **DATA-03** | 🟠 | Tiến độ nằm trong **mảng nhúng** trong `enrollments` và cập nhật mỗi 15 giây (positional update). Mỗi heartbeat ghi lên cùng một document lớn dần, tăng tranh chấp, khó lập chỉ mục cho báo cáo theo bài. | Tách `lesson_progress {userId, lessonId, coverage, maxSecond, completed, updatedAt}` với unique `(userId, lessonId)`. Xem xét gom heartbeat qua Redis rồi ghi định kỳ (mục 2.9). |
| **DATA-04** | 🟠 | `users` thiếu **lớp, khoa, khóa, ngày sinh** trong khi Excel import có cột "lớp"; thiếu `mustChangePassword`, `lastLoginAt`, trạng thái kích hoạt. `email` không unique/không có index. | Bổ sung trường; chuẩn hóa MSSV (trim/uppercase) khi import. |
| **DATA-05** | 🟠 | **Thiếu thực thể:** `classes`/`cohorts` (đợt học), gán khóa học cho lớp/sinh viên (ai được học khóa nào, **hạn mở/đóng**), `sessions`, `audit_logs`, `import_jobs`, `settings`, `certificates`(nếu cấp giấy chứng nhận). GDQP&AN thường theo **đợt/lịch** cụ thể. | Bổ sung model và quy tắc ghi danh (enrollment) tự động theo lớp/đợt. |
| **DATA-06** | 🟡 | Trạng thái lọc "**Chưa học**" ở admin không có trường tương ứng; hiện phải suy ra. | Định nghĩa máy trạng thái (mục 4.1) và lưu `status` có index. |
| **DATA-07** | 🟡 | Thiếu chỉ mục quan trọng: `quiz_attempts (userId, courseId, submittedAt)`, `questions (courseId, active, lessonId)`, `lessons (courseId, order)`, `users (role, isActive)`. Tìm kiếm tên tiếng Việt: regex trên chuỗi có dấu **chậm và không bỏ dấu được**. | Thêm trường `nameNormalized` (bỏ dấu, chữ thường, chuẩn hóa Unicode **NFC**) và index; tìm theo tiền tố. |
| **DATA-08** | 🟡 | `videoDurationSeconds` nhập tay, `required`: sai số so với thực tế làm hỏng logic 95%. | Tự đo bằng ffprobe khi xử lý video (VID-05). |
| **DATA-09** | 🟡 | `courses.order`, `lessons.order` không ràng buộc duy nhất/không có quy tắc sắp xếp lại. Không có `updatedAt`/`createdBy` cho nội dung. | Đánh dấu `timestamps: true`, cột `createdBy`, quy tắc đổi thứ tự. |
| **DATA-10** | 🟡 | Điểm cao nhất và `attemptsCount` lưu ở `enrollments` (dữ liệu dẫn xuất) có thể lệch với `quiz_attempts`. | Coi `quiz_attempts` là nguồn sự thật; cập nhật dẫn xuất trong cùng giao dịch; có job đối soát. |
| **DATA-11** | 🟡 | **Transaction và Change Streams** đều cần MongoDB **replica set**; bản đơn lẻ (standalone) không hỗ trợ. | Chạy tối thiểu replica set một node (dev) / ba node (prod), hoặc dùng managed (Atlas). |
| **DATA-12** | 🟢 | Múi giờ, lưu trữ thời gian. | Lưu UTC, hiển thị `Asia/Ho_Chi_Minh`. |

### 2.6. Thời gian thực (SSE / WebSocket)

| Mã | Mức | Phát hiện | Đề xuất |
|---|:---:|---|---|
| **RT-01** | 🟡 | Chưa quyết SSE hay WebSocket. Người nhận là **admin (ít người)**, luồng một chiều server → client: **SSE là đủ**, đơn giản hơn, tự nối lại. | Chọn SSE (hoặc thậm chí polling 5-10 giây nếu không cần tức thời). |
| **RT-02** | 🟠 | Nếu chạy PM2 **cluster/nhiều instance**, SSE giữ kết nối trong bộ nhớ từng tiến trình: sự kiện phát ở worker A **không đến** admin đang kết nối worker B. | Pub/Sub qua **Redis** (hoặc MongoDB Change Streams) để phát sự kiện tới mọi worker. |
| **RT-03** | 🟡 | Nginx mặc định **buffer** phản hồi và ngắt kết nối nhàn rỗi, làm SSE chậm hoặc đứt. Thiếu cơ chế bỏ sót sự kiện khi mất kết nối. | Cấu hình `proxy_buffering off`, `proxy_read_timeout` dài, gửi `:keepalive` định kỳ, hỗ trợ `Last-Event-ID`; khi kết nối lại thì nạp lại trạng thái hiện tại. |
| **RT-04** | 🟡 | Cao điểm nộp bài (hàng trăm sự kiện/giây) làm giao diện admin giật/nghẽn. | Gộp (batch/throttle) sự kiện 1-2 giây/lần; cập nhật số liệu tổng bằng bộ đếm thay vì tính lại. |
| **RT-05** | 🟡 | Xác thực SSE: `EventSource` không gửi được header tùy chỉnh. | Dùng cookie phiên (đã có) và kiểm tra quyền admin trên endpoint SSE. |

### 2.7. Cổng quản trị (Admin Portal)

| Mã | Mức | Phát hiện | Đề xuất |
|---|:---:|---|---|
| **ADM-01** | 🟠 | **Import Excel** chưa có quy trình: kiểm tra file, trùng MSSV, ký tự lỗi/khoảng trắng, **mã hóa Unicode (NFC/NFD)**, số dòng lớn, báo cáo lỗi từng dòng, hoàn tác. | Quy trình 3 bước: tải lên → **xem trước & kiểm tra (dry-run)** → xác nhận. Xuất file lỗi; lưu `import_jobs`; tải mẫu Excel chuẩn; import theo lô/stream. |
| **ADM-02** | 🟡 | Export báo cáo "chuẩn in ấn" chưa xác định **mẫu cột/biểu mẫu** và khối lượng (5.000 dòng nếu xây trong bộ nhớ gây nặng). | Chốt mẫu báo cáo với trung tâm; xuất **streaming** (ExcelJS stream) hoặc job nền + link tải. |
| **ADM-03** | 🟡 | Xóa sinh viên/khóa học/bài học/câu hỏi: chưa nói ảnh hưởng đến tiến độ và lịch sử. | Soft delete + lưu trữ (archive); chặn xóa khi đã có dữ liệu liên quan. |
| **ADM-04** | 🟡 | Admin không có công cụ **can thiệp hợp lệ**: đặt lại tiến độ, mở khóa thi lại, đặt lại mật khẩu, khiếu nại điểm. | Thêm chức năng có **ghi log lý do** (audit). |
| **ADM-05** | 🟢 | Dashboard: "đã xem xong video" cần định nghĩa nhất quán với điều kiện hoàn thành; tính số liệu tổng bằng aggregate/bộ đếm. | Định nghĩa chỉ số (metric dictionary); cache ngắn hạn. |

### 2.8. Hạ tầng & vận hành

| Mã | Mức | Phát hiện | Đề xuất |
|---|:---:|---|---|
| **OPS-01** | 🟠 | **Không có sao lưu/khôi phục.** Mất DB = mất toàn bộ kết quả của 5.000 sinh viên. Không có RPO/RTO. | `mongodump`/snapshot hằng ngày (+ oplog nếu replica set), lưu **ngoài VPS** (R2 khác bucket), **thử khôi phục định kỳ**. Đặt RPO/RTO (vd. RPO ≤ 1 giờ, RTO ≤ 4 giờ). |
| **OPS-02** | 🟠 | Không có **giám sát/cảnh báo/log tập trung**: PM2 log không đủ. | Uptime Kuma/Prometheus + Grafana, cảnh báo CPU/RAM/disk/độ trễ/5xx, log có cấu trúc (pino) kèm `requestId`; theo dõi kích thước DB. |
| **OPS-03** | 🟠 | Không có **CI/CD, môi trường dev/staging/prod**, quy trình triển khai/rollback. PM2 restart không đảm bảo zero-downtime nếu không dùng `reload` + health check. | GitHub Actions: lint, typecheck, test, build; triển khai qua Docker Compose hoặc PM2 `reload`; staging trùng cấu hình prod; migration có kiểm soát. |
| **OPS-04** | 🟡 | Cấu hình Nginx chưa nêu: `client_max_body_size`, gzip/brotli, header bảo mật, rate limit, timeout, log. | Chuẩn hóa file cấu hình, kèm ví dụ (mục 4.4). |
| **OPS-05** | 🟡 | Chưa nêu **kích thước VPS** (vCPU/RAM/SSD), hệ điều hành, tường lửa, bảo vệ DDoS (Cloudflare proxy phía trước), cập nhật vá lỗi OS. | Đề xuất tối thiểu ban đầu để load test: 4 vCPU / 8 GB RAM / SSD; chạy Cloudflare proxy trước Nginx. |
| **OPS-06** | 🟡 | Chi phí R2/S3 chưa được ước tính (dung lượng lưu, số request; R2 không tính phí egress nhưng có phí thao tác lớp A/B). | Ước lượng chi phí theo số bài, dung lượng, số lượt xem. |
| **OPS-07** | 🟢 | Không có **chế độ bảo trì**, thông báo sự cố cho sinh viên, trang trạng thái. | Trang bảo trì tĩnh do Nginx trả về. |

### 2.9. Hiệu năng & dung lượng (phân tích ước lượng)

Tài liệu khẳng định *"5.000 sinh viên truy cập đồng thời hoàn toàn mượt mà"*: đây là **khẳng định chưa có căn cứ**. Ước lượng dưới đây dựa trên **giả định do người đánh giá đặt ra**, cần thay bằng số liệu thật của trung tâm.

| Kịch bản | Giả định | Tải ước tính | Nhận xét |
|---|---|---|---|
| Heartbeat | 2.000 người xem đồng thời (40%), mỗi 15 giây/lần | ≈ **133 ghi/giây** (tối đa 5.000 → ≈ 333/giây) | Khả thi với Node + MongoDB tốt, **nếu** có index và cập nhật nhẹ; rủi ro nếu ghi vào mảng nhúng lớn và chung VPS với Next.js |
| Đăng nhập đồng loạt | 5.000 lượt trong 5 phút (~17/giây), bcrypt JS thuần | Mỗi lượt băm chiếm CPU **đáng kể** trên event loop | Đỉnh tải làm chậm cả heartbeat → dùng bcrypt native/argon2, giới hạn tốc độ |
| Nộp bài đồng loạt | Cuối buổi/ngày hạn: hàng trăm lượt trong vài phút | Chấm điểm nhẹ, nhưng cần ghi attempt + cập nhật enrollment + phát SSE | Cần transaction/idempotency (QZ-07), gộp sự kiện SSE |
| Băng thông video | 2.000 × 2 Mbps | ≈ **4 Gbps** | Chỉ khả thi vì video ở R2/CDN; **tuyệt đối không** đi qua VPS |

**Đề xuất kiến trúc giảm tải:**
1. Thêm **Redis** (một node) cho: rate limit, phiên xem đang hoạt động, đệm heartbeat, Pub/Sub cho SSE.
2. Chỉ ghi DB khi có thay đổi đáng kể hoặc mỗi 30-60 giây (gộp), heartbeat hằng ngày vẫn 15 giây ở client.
3. Chạy backend ở chế độ **cluster** (`pm2 -i max`) và bảo đảm ứng dụng **stateless**.
4. Kiểm chứng bằng **load test thật** (mục 5.4) trước khi tuyên bố năng lực.

### 2.10. Mâu thuẫn & thiếu sót trong tài liệu

| Mã | Mức | Nội dung |
|---|:---:|---|
| **DOC-01** | 🟡 | **Không có API contract**: chỉ nhắc `/api/lessons/:id/heartbeat`, `/api/auth`, `/api/student`, `/api/admin`. Chưa có danh sách endpoint, request/response, mã lỗi, phân quyền. Đề xuất OpenAPI ở mục 4.3. |
| **DOC-02** | 🟡 | Mục 3.5 đặt tên `enrollments` & `lesson_progress` nhưng chỉ có một schema. |
| **DOC-03** | 🟡 | `totalQuestionsPerQuiz` cấu hình được, nhưng luồng 4.1 cố định "10 câu" và "≥ 8". Điểm đạt `passScore` cũng nên tách khỏi số câu. |
| **DOC-04** | 🟡 | Mục 1 ghi "chuẩn Stitch" nhưng bước 1 ở mục 7 **chờ người dùng xuất mã Stitch** mới bắt đầu: chặn tiến độ, trong khi backend có thể làm song song. |
| **DOC-05** | 🟡 | Chưa có **phạm vi MVP**, mốc thời gian, ước lượng nhân lực, tiêu chí hoàn thành, danh sách rủi ro. |
| **DOC-06** | 🟢 | Đường dẫn `d:/GDQPAN/` là Windows, trong khi triển khai là Linux VPS: chú ý phân biệt hoa/thường tên file, kết thúc dòng, script. |
| **DOC-07** | 🟢 | Tên sản phẩm/nhãn "Đạt / Chưa đạt / Chưa học" chưa có định nghĩa trạng thái thống nhất giữa student UI, admin UI và báo cáo. |

### 2.11. Giao diện, trải nghiệm & yêu cầu phi chức năng

| Mã | Mức | Phát hiện | Đề xuất |
|---|:---:|---|---|
| **UX-01** | 🟠 | Sinh viên chủ yếu dùng **điện thoại**, mạng di động, trình duyệt trong ứng dụng (Zalo/Facebook). Kế hoạch chưa nêu mobile-first, ma trận thiết bị/trình duyệt. | Thiết kế mobile-first; danh sách thiết bị hỗ trợ; test video và custom player trên các trình duyệt đó. |
| **UX-02** | 🟡 | Chưa có **khả năng truy cập** (a11y: điều khiển bàn phím, phụ đề, tương phản), **đa ngôn ngữ** (có thể chỉ tiếng Việt). | Mục tiêu WCAG 2.1 AA ở mức hợp lý; phụ đề `.vtt`. |
| **UX-03** | 🟡 | Thông báo lỗi và trạng thái: mất mạng khi xem/thi, phiên hết hạn giữa bài thi, video lỗi 403 (URL hết hạn) khi đang xem lâu. | Tự làm mới URL video trước khi hết hạn; lưu nháp câu trả lời cục bộ; thông điệp lỗi thân thiện. |
| **NFR-01** | 🟠 | **Không có yêu cầu phi chức năng đo được**: thời gian phản hồi, số người dùng đồng thời, độ sẵn sàng, RPO/RTO. | Đề xuất ở mục 4.5. |

### 2.12. Tuân thủ & dữ liệu cá nhân

| Mã | Mức | Phát hiện | Đề xuất |
|---|:---:|---|---|
| **LEG-01** | 🟡 | Hệ thống lưu họ tên, MSSV, email, lịch sử học và điểm của sinh viên: là **dữ liệu cá nhân**. Chưa có chính sách thu thập, thời hạn lưu, quyền truy cập, thông báo cho sinh viên. Theo hiểu biết của mình, quy định hiện hành gồm Nghị định 13/2023/NĐ-CP và Luật Bảo vệ dữ liệu cá nhân mới (hiệu lực 2026): **cần đối chiếu văn bản hiện hành với bộ phận pháp chế**. | Chính sách quyền riêng tư, thời hạn lưu trữ, phân quyền truy cập, mã hóa đường truyền/lưu trữ, xóa/ẩn danh khi hết hạn. |
| **LEG-02** | 🟡 | Dùng dịch vụ đám mây nước ngoài (R2/S3) cho học liệu GDQP&AN: cần xác nhận với đơn vị chủ quản (trung tâm/ĐHQG) về **quy định lưu trữ nội dung và dữ liệu**. | Xin xác nhận bằng văn bản; cân nhắc vùng lưu trữ hoặc nhà cung cấp trong nước nếu bắt buộc. |
| **LEG-03** | 🟢 | Bản quyền video/hình ảnh/học liệu và phần mềm phụ thuộc (giấy phép mã nguồn mở). | Kiểm kê bản quyền học liệu; quét giấy phép thư viện. |

---

## 3. TỔNG HỢP MÂU THUẪN TRONG LOGIC NGHIỆP VỤ (TỪ GÓC NHÌN TESTER)

Các điểm dưới đây nếu không được chốt sẽ dẫn đến **kết quả test không thể xác định là đúng hay sai**:

1. Sinh viên tự đăng ký hay Admin import? Ai tạo tài khoản, mật khẩu ban đầu là gì?
2. Mở khóa bài thi sau **một bài** hay **tất cả bài**? Điểm đạt tính theo bài hay theo khóa?
3. Điều kiện hoàn thành video: `watchedSeconds ≥ 95%` **và** `maxSecond ≥ 90%`: nếu tua lại xem lại, giá trị nào quyết định? Tốc độ 1.25x có được cộng không?
4. Làm lại bài: giới hạn số lần? Thời gian chờ? Câu hỏi có được lặp lại?
5. Điểm đạt đơn vị: `>= 8` trên thang 10 với đề 10 câu (8/10 = 80%). Khi đổi `totalQuestionsPerQuiz` thì công thức là gì?
6. Đã đạt rồi có được thi lại để nâng điểm? Có được xem lại video không?
7. Khi Admin **sửa/xóa câu hỏi** hoặc đổi độ dài video sau khi sinh viên đã học: tiến độ và kết quả cũ xử lý ra sao?
8. "Chưa học" khác "Chưa đạt" thế nào (đã xem một phần, chưa thi, đã thi trượt)?
9. Khóa học có **thời hạn** (mở/đóng) không? Hết hạn có khóa làm bài không?
10. Sinh viên hết phiên khi đang thi: bài làm dở tính thế nào?

---

## 4. ĐỀ XUẤT ĐIỀU CHỈNH KIẾN TRÚC

### 4.1. Máy trạng thái đề xuất (tiến độ khóa học)

```
NOT_STARTED ──(xem bài đầu)──► IN_PROGRESS ──(hoàn thành mọi bài bắt buộc)──► QUIZ_UNLOCKED
                                                                                   │
                                                              (POST /quiz/start)   ▼
                                                                             QUIZ_IN_PROGRESS
                                                                              │           │
                                                                (nộp, ≥ passScore)   (nộp, < passScore / hết giờ)
                                                                              ▼           ▼
                                                                          PASSED     QUIZ_FAILED ──(hết cooldown)──► QUIZ_UNLOCKED
```
- `PASSED` là trạng thái **kết thúc, đơn điệu** (không lùi lại).
- Bộ lọc admin: *Chưa học* = `NOT_STARTED`, *Đang học* = `IN_PROGRESS/QUIZ_*`, *Đạt* = `PASSED`, *Chưa đạt* = có attempt thất bại và chưa `PASSED`.

### 4.2. Thiết kế heartbeat an toàn hơn (giả mã)

```ts
// POST /api/lessons/:id/heartbeat  { sessionId, seq, currentTime, playing, rate }
onHeartbeat(user, lesson, hb):
  session = getActiveWatchSession(user.id, lesson.id)      // Redis, TTL 60s
  if (!session || session.id !== hb.sessionId) return 409  // phiên khác/đa tab
  if (hb.seq <= session.lastSeq) return 200                // idempotent, bỏ trùng
  elapsed = now() - session.lastAt                         // đồng hồ server
  if (hb.playing && hb.rate <= 1) {
      credit = clamp(elapsed, 0, 30)                       // tối đa 30s
      credit = min(credit, hb.currentTime - session.lastTime + 1)  // không vượt vị trí phát
      markCovered(lesson, session.lastTime, session.lastTime + credit)  // vùng duy nhất
  }
  session.update(lastAt = now(), lastTime = hb.currentTime, lastSeq = hb.seq)
  if (coverage(user, lesson) >= lesson.minCoverage) completeLesson(user, lesson)
```

### 4.3. Danh mục API đề xuất (rút gọn, cần bổ sung OpenAPI)

| Nhóm | Endpoint | Vai trò | Ghi chú |
|---|---|---|---|
| Auth | `POST /api/auth/login`, `/logout`, `/refresh` | Công khai | Rate limit, khóa tạm |
| Auth | `POST /api/auth/activate`, `/forgot`, `/reset` | Công khai | Token một lần, hết hạn |
| Student | `GET /api/courses`, `GET /api/courses/:id` | Student | Chỉ khóa đã ghi danh |
| Student | `GET /api/lessons/:id/stream` | Student | Cấp URL/token video ngắn hạn, kiểm tra quyền + thứ tự bài |
| Student | `POST /api/lessons/:id/heartbeat` | Student | Xem mục 4.2 |
| Student | `POST /api/courses/:id/quiz/start` | Student | Tạo attempt, lưu `questionIds` |
| Student | `POST /api/quiz/:attemptId/submit` | Student | Một lần, kiểm tra hạn |
| Admin | `GET /api/admin/dashboard`, `GET /api/admin/events` (SSE) | Admin | Bộ đếm, sự kiện |
| Admin | `GET/POST/PATCH/DELETE /api/admin/students` | Admin | Phân trang, lọc, tìm kiếm |
| Admin | `POST /api/admin/students/import` (`/preview`, `/commit`) | Admin | Dry-run |
| Admin | `GET /api/admin/reports/export` | Admin | Job nền + tải |
| Admin | `CRUD /api/admin/courses`, `/lessons`, `/questions` | Admin | Soft delete, phiên bản |
| Admin | `POST /api/admin/uploads/init`, `/complete` | Admin | Multipart trực tiếp lên R2 |

### 4.4. Ví dụ cấu hình Nginx cho SSE và API

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 2m;               # API thường; upload video đi thẳng lên R2
}
location /api/admin/events {                # SSE
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 1h;
}
```

### 4.5. Yêu cầu phi chức năng (NFR) đề xuất, cần xác nhận với trung tâm

| Chỉ tiêu | Mục tiêu đề xuất |
|---|---|
| Người dùng đồng thời | Tối đa ~2.000 (cần dữ liệu thực), kiểm chứng tới 3.000 |
| Thời gian phản hồi API (p95) | ≤ 300 ms (heartbeat ≤ 150 ms), đăng nhập ≤ 1 s |
| Tỉ lệ lỗi 5xx trong tải đỉnh | < 0.5% |
| Độ sẵn sàng giờ cao điểm | ≥ 99.5% |
| RPO / RTO | ≤ 1 giờ / ≤ 4 giờ |
| Thời gian bắt đầu phát video | ≤ 3 giây trên 4G |
| Thiết bị hỗ trợ | Chrome/Edge/Firefox mới nhất; Safari iOS/Android Chrome (2 phiên bản gần nhất) |

### 4.6. Lộ trình sửa đổi tài liệu kiến trúc (v1.1)

1. Chốt các quyết định "hoặc/hoặc" (ADR) và mô hình triển khai (on-premise hay VPS).
2. Viết lại mục 3 (dữ liệu) theo DATA-01…12; thêm sơ đồ ER.
3. Viết lại mục 4 với máy trạng thái, quy tắc nghiệp vụ (mục 3 của báo cáo này) và luồng ngoại lệ.
4. Thêm mục **Bảo mật**, **Vận hành**, **NFR**, **API contract**, **Chiến lược kiểm thử**, **Tiến độ & rủi ro**.

---

## 5. CHIẾN LƯỢC KIỂM THỬ ĐỀ XUẤT (VAI TRÒ TESTER)

### 5.1. Mô hình kiểm thử

| Tầng | Công cụ gợi ý | Phạm vi | Mục tiêu |
|---|---|---|---|
| Unit | Vitest/Jest | `quizScoringService`, tính coverage video, chuẩn hóa MSSV/tên, quy tắc trạng thái | Độ phủ dòng ≥ 80% cho logic nghiệp vụ lõi |
| Integration/API | Supertest + MongoDB thật (Testcontainers) | Auth, heartbeat, quiz, import/export, phân quyền | Mọi endpoint có test dương + âm + quyền |
| E2E | Playwright (Chromium, WebKit, Firefox + emulation di động) | Đăng nhập → xem video → mở khóa → thi → admin thấy kết quả | Kịch bản chính chạy tự động ở CI |
| Tải/hiệu năng | k6 | Mục 5.4 | Chứng minh NFR bằng số liệu |
| Bảo mật | OWASP ZAP, `npm audit`, Semgrep, kiểm thử thủ công | OWASP ASVS L1-L2, Top 10 | Không còn lỗi Cao/Nghiêm trọng |
| Thăm dò (exploratory) | Thủ công theo charter | Video player, mất mạng, thiết bị lạ | Tìm lỗi mà test tự động bỏ sót |
| UAT | Cán bộ trung tâm + nhóm sinh viên thử | Luồng thực tế, báo cáo Excel | Biên bản nghiệm thu |

### 5.2. Kịch bản kiểm thử trọng yếu (bộ tối thiểu)

| ID | Khu vực | Kịch bản | Kết quả mong đợi |
|---|---|---|---|
| TC-AUTH-01 | Auth | Đăng nhập đúng/sai; sai 5 lần liên tiếp | Sai → lỗi chung chung (không lộ tài khoản tồn tại); khóa tạm sau N lần |
| TC-AUTH-02 | Auth | Tài khoản `isActive=false` đang có phiên | Phiên bị vô hiệu ngay (không chờ JWT hết hạn) |
| TC-AUTH-03 | Auth | Thử đăng ký với MSSV không có trong danh sách / đã kích hoạt | Từ chối |
| TC-AUTH-04 | Auth | Gửi request thay đổi dữ liệu từ origin khác (CSRF) | Bị chặn |
| TC-AUTHZ-01 | Phân quyền | Student gọi `/api/admin/*` bằng cookie hợp lệ | 403 |
| TC-AUTHZ-02 | Phân quyền | Student A đọc/ghi tiến độ hoặc attempt của student B (IDOR) | 403/404 |
| TC-AUTHZ-03 | Phân quyền | Xem bài khi chưa ghi danh khóa/chưa hoàn thành bài trước | Từ chối cấp URL video |
| TC-VID-01 | Video | Xem đủ 100% ở tốc độ 1x liên tục | `completed=true` đúng ngưỡng |
| TC-VID-02 | Video | Tua tới cuối (client) / gửi heartbeat `currentTime` nhảy vọt | Server **không** cộng tiến độ tương ứng |
| TC-VID-03 | Video | Đặt tốc độ 2x (DevTools) hoặc gửi heartbeat dày | Không vượt thời gian thực tế của server |
| TC-VID-04 | Video | Hai tab/hai thiết bị cùng xem một hoặc nhiều bài | Chỉ một phiên được cộng; phiên còn lại bị từ chối/cảnh báo |
| TC-VID-05 | Video | Tạm dừng 10 phút rồi tiếp tục; tab ẩn; khóa màn hình | Không cộng thời gian lúc dừng; tiếp tục đúng vị trí |
| TC-VID-06 | Video | Mất mạng 60 giây rồi có lại | Tiến độ không mất sai lệch; không bị cộng khống |
| TC-VID-07 | Video | URL video hết hạn khi đang xem | Tự làm mới không gián đoạn; URL cũ hết hiệu lực đúng hạn |
| TC-VID-08 | Video | iOS Safari (toàn màn hình), Android Chrome, Zalo in-app | Điều khiển và chặn tua hoạt động; tiến độ đúng |
| TC-QZ-01 | Quiz | Nút thi khi chưa đủ điều kiện; gọi API trực tiếp | Từ chối ở **server** (không chỉ ẩn nút) |
| TC-QZ-02 | Quiz | Phản hồi `/quiz/start` | Không chứa `correct`/`explanation`; đủ số câu; không trùng câu |
| TC-QZ-03 | Quiz | Nộp `questionId` không thuộc đề đã phát; thiếu câu; trùng câu | Từ chối/chấm 0 theo quy tắc, có log |
| TC-QZ-04 | Quiz | Nộp hai lần (double click, 2 tab, gửi song song) | Chỉ một lần được chấp nhận (idempotent) |
| TC-QZ-05 | Quiz | Điểm biên: đúng 7/10, 8/10, 9/10, 10/10 | 7 → Chưa đạt; ≥ 8 → Đạt; đúng làm tròn |
| TC-QZ-06 | Quiz | Làm lại nhiều lần liên tiếp | Tuân giới hạn số lần/cooldown; đề mới hợp lệ |
| TC-QZ-07 | Quiz | Nộp sau khi hết hạn attempt / phiên hết hạn giữa bài | Xử lý theo quy tắc, không mất dữ liệu ngoài dự kiến |
| TC-QZ-08 | Quiz | Đã đạt rồi làm lại điểm thấp hơn | `passed` giữ nguyên, `highestScore` đúng |
| TC-QZ-09 | Quiz | Admin sửa/xóa câu hỏi đã có người làm | Lịch sử không hỏng; xem lại đúng nội dung thời điểm thi |
| TC-RT-01 | Realtime | Sinh viên nộp bài, admin đang mở dashboard | Cập nhật ≤ 2 giây, ✅/❌ và điểm đúng |
| TC-RT-02 | Realtime | Admin mất kết nối rồi nối lại; nhiều worker | Không bỏ sót trạng thái; đúng với mọi worker |
| TC-ADM-01 | Admin | Import file: trùng MSSV, thiếu cột, MSSV có khoảng trắng/chữ thường, tên Unicode NFD, 5.000 dòng | Báo lỗi từng dòng, không import nửa vời, tên chuẩn hóa NFC |
| TC-ADM-02 | Admin | Import file `.xlsx` giả mạo/quá lớn/có macro | Từ chối an toàn |
| TC-ADM-03 | Admin | Tìm "nguyen van" ra "Nguyễn Văn"; lọc + phân trang 5.000 dòng | Kết quả đúng, phản hồi ≤ 1 giây |
| TC-ADM-04 | Admin | Xuất Excel với tên bắt đầu bằng `=`/`@` | Không thực thi công thức; số liệu khớp DB |
| TC-ADM-05 | Admin | Thao tác nhạy cảm (đặt lại tiến độ, xóa) | Có audit log (ai, khi nào, lý do) |
| TC-UP-01 | Upload | Upload video lớn qua multipart, ngắt mạng giữa chừng, tiếp tục | Hoàn tất hoặc dọn dẹp đúng, không tệp mồ côi |
| TC-OPS-01 | Vận hành | Khôi phục từ backup vào môi trường trống | Dữ liệu đầy đủ, ứng dụng chạy được |
| TC-OPS-02 | Vận hành | Kill tiến trình backend / reboot VPS | Tự khởi động lại, người dùng thấy gián đoạn tối thiểu |

### 5.3. Kiểm thử bảo mật (danh sách rà soát)

- [ ] Kiểm tra IDOR trên **mọi** endpoint có `:id`.
- [ ] Injection NoSQL (`$ne`, `$gt`, `$where`) ở body/query/params.
- [ ] XSS lưu trữ trong tên, nội dung câu hỏi, giải thích; CSP hoạt động.
- [ ] Cờ cookie (`HttpOnly`, `Secure`, `SameSite`), CSRF, CORS chặt (không `*`).
- [ ] Brute-force đăng nhập/kích hoạt/quên mật khẩu; liệt kê tài khoản (user enumeration).
- [ ] Quyền của khóa R2: chỉ đúng bucket, không quyền liệt kê/xóa dư thừa; bucket không công khai ngoài ý muốn.
- [ ] Rò rỉ dữ liệu trong response/log (`correct`, `passwordHash`, token).
- [ ] Upload: MIME giả, tên tệp độc hại, kích thước.
- [ ] Rate limit hoạt động ở Nginx và ứng dụng; kiểm tra sau Cloudflare (IP thật).
- [ ] Thư viện có lỗ hổng (`npm audit`, Dependabot), phiên bản Next/Node đang được hỗ trợ.

### 5.4. Kiểm thử tải (k6): kịch bản đề xuất

| Kịch bản | Mô tả | Tiêu chí đạt |
|---|---|---|
| **L1: Đăng nhập đồng loạt** | 5.000 người dùng đăng nhập trong 5 phút, đỉnh ×2 | p95 ≤ 1 s, không lỗi 5xx, CPU < 80% |
| **L2: Heartbeat ổn định** | 2.000 → 3.000 người xem, gửi mỗi 15 giây, chạy 60 phút | p95 ≤ 150 ms, không tăng dần độ trễ (rò rỉ), DB write không nghẽn |
| **L3: Nộp bài đồng loạt** | 1.000 lượt bắt đầu + nộp trong 5 phút | Không mất/đúp attempt; SSE admin còn mượt |
| **L4: Hỗn hợp** | L1 + L2 + L3 chạy đồng thời với admin dùng dashboard/export | Đáp ứng NFR mục 4.5 |
| **L5: Soak** | Tải vừa 8-12 giờ | Không rò rỉ bộ nhớ/kết nối, log/DB không phình bất thường |
| **L6: Chịu lỗi** | Tắt tiến trình, ngắt DB/Redis tạm thời | Hồi phục tự động, không hỏng dữ liệu |

### 5.5. Tiêu chí nghiệm thu (Definition of Done) đề xuất

- Toàn bộ bug **Nghiêm trọng/Cao** đã đóng; không còn lỗ hổng bảo mật Cao.
- Bộ TC-* ở mục 5.2 chạy đạt (tự động hóa ≥ 70%).
- Load test L1-L4 đạt NFR trên môi trường staging có cấu hình giống production.
- Khôi phục backup đã được thử thành công và lập biên bản.
- Runbook vận hành, tài liệu người dùng cho admin và sinh viên hoàn thành.
- UAT có chữ ký xác nhận của trung tâm.

---

## 6. MA TRẬN RỦI RO

| # | Rủi ro | Khả năng | Ảnh hưởng | Mức | Biện pháp |
|---|---|:---:|:---:|:---:|---|
| R1 | Giả mạo danh tính do đăng ký tự do | Cao | Cao | 🔴 | Kích hoạt từ danh sách import, xác minh email trường |
| R2 | Gian lận tiến độ video (script, đa tab, tốc độ) | Cao | Cao | 🔴 | Kiểm soát phía server, một phiên xem, coverage |
| R3 | Lộ/vét ngân hàng câu hỏi, thử-sai đến đạt | Cao | Cao | 🔴 | Lưu đề đã phát, cooldown, ngân hàng lớn, xáo trộn |
| R4 | Mất dữ liệu (không backup, VPS hỏng) | Trung bình | Rất cao | 🔴 | Backup ngoài site, replica set, thử khôi phục |
| R5 | Quá tải giờ cao điểm (đăng nhập/nộp bài) | Trung bình | Cao | 🟠 | Load test, Redis, cluster, argon2/bcrypt native |
| R6 | Lỗ hổng do phiên bản hết hỗ trợ (Next 14) | Cao | Cao | 🟠 | Nâng cấp Next 16 hoặc bỏ Next |
| R7 | Video bị tải lậu/chia sẻ | Trung bình | Trung bình | 🟡 | HLS + token, hoặc chấp nhận rủi ro có văn bản |
| R8 | Video giật trên 4G do không transcode | Cao | Trung bình | 🟠 | FFmpeg, nhiều độ phân giải |
| R9 | Phát sinh pháp lý về dữ liệu/lưu trữ | Trung bình | Cao | 🟠 | Rà soát với pháp chế, xin xác nhận |
| R10 | Lỗi khi import dữ liệu lớn (Unicode, trùng) | Cao | Trung bình | 🟡 | Dry-run, chuẩn hóa NFC, báo lỗi từng dòng |
| R11 | Phụ thuộc chờ thiết kế Stitch | Trung bình | Trung bình | 🟡 | Làm song song backend; dùng UI tạm |
| R12 | Yêu cầu nghiệp vụ mơ hồ dẫn đến làm lại | Cao | Trung bình | 🟠 | Chốt 10 câu hỏi ở mục 3 & 7 trước khi code |

---

## 7. CÂU HỎI CẦN LÀM RÕ VỚI TRUNG TÂM / NGƯỜI ĐẶT YÊU CẦU

1. Danh tính: có SSO/email trường không? Nguồn danh sách sinh viên (Excel) do ai cấp, cập nhật thế nào?
2. Cấu trúc học phần: mỗi môn/đợt học có bao nhiêu bài, video dài bao nhiêu, tổng dung lượng?
3. Quy tắc thi: thi cuối khóa hay theo bài? Số lần thi, cooldown, thời gian làm bài, có giám sát không?
4. Có **lịch/hạn** cho từng đợt, lớp không? Hết hạn xử lý thế nào?
5. Số sinh viên **đồng thời** thực tế tại giờ cao điểm là bao nhiêu (kể cả hạn chót)?
6. Nội dung video có nhạy cảm/không được phép lưu ngoài lãnh thổ hay ngoài hạ tầng của trường không?
7. Mức chấp nhận rủi ro tải lậu video? Có cần cấp giấy chứng nhận/xuất kết quả đúng mẫu nào không?
8. Ai vận hành hệ thống (đội IT nào), ai trực khi sự cố, cửa sổ bảo trì?
9. Ngân sách hạ tầng (VPS, R2/S3, Redis, giám sát) và thời hạn ra mắt?
10. Thiết bị chính của sinh viên (điện thoại/máy tính), ngôn ngữ, yêu cầu truy cập?

---

## 8. LỘ TRÌNH TRIỂN KHAI ĐIỀU CHỈNH (GỢI Ý)

| Giai đoạn | Nội dung | Kết quả |
|---|---|---|
| **0. Chốt yêu cầu & ADR** (1 tuần) | Trả lời mục 7, chốt quy tắc nghiệp vụ, cập nhật tài liệu v1.1, chọn Next 16 hoặc SPA | Tài liệu kiến trúc + đặc tả nghiệp vụ được duyệt |
| **1. Nền tảng** (1-2 tuần) | Monorepo, CI, Docker Compose, MongoDB replica set, Redis, auth + kích hoạt tài khoản, RBAC, audit log | Đăng nhập an toàn, pipeline chạy |
| **2. Lõi học tập** (2-3 tuần) | Khóa/bài, upload trực tiếp R2 + FFmpeg, player + heartbeat + coverage, test VID | Xem video với tiến độ đáng tin cậy |
| **3. Bài thi** (1-2 tuần) | Ngân hàng câu hỏi, start/submit, cooldown, bảo toàn lịch sử, test QZ | Thi và chấm điểm toàn vẹn |
| **4. Admin & thời gian thực** (2 tuần) | Dashboard, import/export, SSE + Redis, báo cáo | Vận hành được bởi trung tâm |
| **5. Ổn định & nghiệm thu** (1-2 tuần) | Load test, pentest, backup/khôi phục, tài liệu, UAT, thử nghiệm với 1 lớp nhỏ (pilot) | Sẵn sàng production |

> Thời lượng chỉ là **gợi ý sơ bộ** cho một nhóm nhỏ (2-3 người), cần điều chỉnh theo năng lực thực tế. Nên **pilot với một lớp nhỏ** trước khi mở toàn bộ 5.000 sinh viên.

---

## 9. DANH SÁCH VIỆC ƯU TIÊN (ACTION CHECKLIST)

**Ưu tiên 1: trước khi viết dòng code đầu tiên**
- [ ] Bỏ đăng ký tự do, chuyển sang import + kích hoạt tài khoản (SEC-01, SEC-07)
- [ ] Chốt phiên bản: Next 16 (hoặc SPA), Node LTS, React mới (ARCH-01/02)
- [ ] Chốt phạm vi bài thi, quy tắc điểm/làm lại/cooldown (QZ-02, QZ-04, mục 3)
- [ ] Thiết kế lại attempt: `start` lưu `questionIds`, `submit` một lần, idempotent (QZ-01, QZ-07)
- [ ] Thiết kế heartbeat phía server: một phiên xem, khóa tốc độ, coverage (VID-01, VID-02)
- [ ] Sửa schema: tên trường, unique index, bổ sung `lesson_progress`, soft delete, snapshot (DATA-01…07)
- [ ] Chốt R2 vs S3, SSE vs WebSocket, cách phát video có/không CDN (ARCH-05, VID-04)
- [ ] Chốt mô hình triển khai (on-premise hay VPS), TLS, DDoS (ARCH-04, OPS-05)

**Ưu tiên 2: song song với phát triển**
- [ ] Thay `bcryptjs` bằng bcrypt native/argon2; rate limit; refresh token; giới hạn phiên (SEC-02…05, SEC-08)
- [ ] MongoDB replica set, Redis, backup ngoài site, giám sát, CI/CD (DATA-11, OPS-01…03)
- [ ] Pipeline FFmpeg + upload trực tiếp multipart (VID-05, VID-06)
- [ ] API contract OpenAPI + package `shared` (DOC-01, ARCH-09)
- [ ] Viết NFR, kế hoạch test, dựng E2E/k6 sớm (TEST-01, mục 5)

**Ưu tiên 3: trước khi ra mắt**
- [ ] Load test L1-L6 đạt NFR; pentest/OWASP ASVS
- [ ] Thử khôi phục backup, runbook sự cố, chế độ bảo trì
- [ ] Rà soát pháp lý về dữ liệu cá nhân và nơi lưu học liệu (LEG-01…03)
- [ ] UAT và pilot một lớp nhỏ

---

## 10. GHI CHÚ VỀ NGUỒN VÀ ĐỘ TIN CẬY

- Thông tin **Next.js 14 hết hỗ trợ (26/10/2025)** và **Next.js 15 EOL 21/10/2026, Next.js 16 là bản LTS đang hoạt động** được đối chiếu từ các trang theo dõi vòng đời phiên bản (endoflife.date và các bài tổng hợp), kiểm tra ngày 29/09/2026. Nên xác nhận lại trên trang chính sách hỗ trợ chính thức của Next.js trước khi chốt.
- Về **presigned URL của R2**: tài liệu Cloudflare hiện hành mô tả ký URL với endpoint S3 API của tài khoản; cách phát qua domain tùy chỉnh/CDN thường dùng Worker hoặc WAF token. Nên thử nghiệm thực tế với cấu hình của bạn.
- Các nhận định về **SheetJS trên npm** và **quy định pháp luật dữ liệu cá nhân Việt Nam** dựa trên hiểu biết chung, chưa tra cứu lại chi tiết trong lần đánh giá này; cần xác minh trước khi ra quyết định.
- Các **con số tải, NFR và tiến độ** là **giả định đề xuất** để làm cơ sở thảo luận, không phải số liệu đo đạc.
- Báo cáo **chưa** đánh giá: mã nguồn hiện có, bản thiết kế Stitch, hạ tầng thực tế của trung tâm.

*— Hết báo cáo —*
