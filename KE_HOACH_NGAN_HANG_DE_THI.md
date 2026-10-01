# 🏦 KẾ HOẠCH & THẨM ĐỊNH: NGÂN HÀNG ĐỀ THI, NHẬP TỪ PDF, TẠO ĐỀ RANDOM

> **Dự án:** E-learning Trung tâm GDQP&AN (mở rộng từ `KE_HOACH_KIEN_TRUC.md` v1.0)
> **Phiên bản:** 1.0 (bản thẩm định, chưa duyệt)
> **Ngày lập:** 01/10/2026
> **Vai trò:** Kỹ sư phần mềm (kiến trúc, backend, frontend) + kiểm thử
> **Quy ước:** ✅ = đã được người yêu cầu chốt · 💡 = đề xuất của người lập kế hoạch, **chờ xác nhận** · ❓ = quyết định còn mở, **không tự chọn** (xem mục 12)

---

## 1. YÊU CẦU & CÁC QUYẾT ĐỊNH ĐÃ CHỐT

### 1.1. Yêu cầu gốc
1. **Ngân hàng đề thi:** cho phép người dùng thêm (add) các bộ câu hỏi lên hệ thống.
2. **Đọc file PDF** bộ câu hỏi và chuyển thành dữ liệu trên web; mỗi bộ câu hỏi có **một mục riêng** trong ngân hàng câu hỏi.
3. **Chọn thủ công** câu hỏi từ ngân hàng đề thi.
4. **Lấy random** câu hỏi từ ngân hàng đề thi.

### 1.2. Quyết định đã chốt ✅

| # | Nội dung | Quyết định của người yêu cầu |
|---|---|---|
| D1 | Loại PDF | **Cả hai loại:** PDF có chữ chọn/copy được **và** PDF scan/ảnh |
| D2 | Cách thể hiện đáp án đúng trong PDF | **Nhiều dạng khác nhau tùy bộ** (không có một chuẩn duy nhất) |
| D3 | Người dùng chức năng này | **Chỉ Admin** tạo bộ đề cho khóa học |
| D4 | Xử lý PDF scan/ảnh | **Kết hợp:** dịch vụ OCR/AI đám mây **và** cho phép không OCR (admin nhập tay hoặc dùng công cụ ngoài) |
| D5 | Kiểm duyệt sau khi đọc PDF | **Lưu trạng thái nháp**, admin duyệt sau rồi mới được dùng |
| D6 | Cách tạo đề | **Random:** mỗi sinh viên nhận đề khác nhau, bốc từ ngân hàng theo cấu hình |

### 1.3. Diễn giải yêu cầu (cần xác nhận ❓)
- "Mục trong ngân hàng cho từng bộ câu" được hiểu là: **mỗi file PDF/bộ câu hỏi tạo ra một "Bộ câu hỏi" (question set)** nằm trong ngân hàng; ngân hàng gồm nhiều bộ, mỗi bộ gồm nhiều câu.
- Yêu cầu gốc có cả "chọn thủ công" và "random", nhưng D6 chọn "Random mỗi sinh viên một đề". **Vai trò của "chọn thủ công" sau D6 chưa rõ** (xem Q1, mục 12). Kế hoạch này **chưa quyết** mà trình bày phương án ở mục 6.3.

---

## 2. THẨM ĐỊNH TỔNG QUAN

### 2.1. Đánh giá khả thi

| Chức năng | Khả thi | Độ phức tạp | Nhận xét |
|---|:---:|:---:|---|
| Ngân hàng đề + quản lý bộ câu hỏi (CRUD) | Cao | Thấp-Trung bình | Nghiệp vụ rõ, là nền cho các chức năng sau |
| Nhập PDF **có text** | Trung bình-Cao | Trung bình-Cao | Khó nhất là **nhận diện đáp án đúng khi có nhiều dạng** (D2) |
| Nhập PDF **scan/ảnh** | Trung bình | Cao | Chất lượng OCR tiếng Việt, nhận diện dấu đánh dấu đáp án, chi phí/bảo mật khi dùng đám mây |
| Duyệt nháp trước khi dùng | Cao | Trung bình | Bắt buộc về thực tế: không parser nào chính xác 100% |
| Tạo đề random theo cấu hình | Cao | Trung bình | Thuật toán đơn giản, khó ở **ràng buộc nghiệp vụ** và **lưu đề đã phát** |
| Chọn thủ công | Cao | Thấp | Phụ thuộc vào câu trả lời Q1 |

### 2.2. Nhận định chính

1. **Rủi ro lớn nhất là chất lượng dữ liệu đầu vào**, không phải thuật toán random. Parser sai (thiếu đáp án, lệch đáp án, cắt nhầm câu) khiến sinh viên bị chấm sai. Vì vậy D5 (nháp → duyệt) là bắt buộc, và hệ thống phải **không cho dùng** câu chưa duyệt hoặc chưa có đáp án.
2. **"Nhiều dạng đáp án tùy bộ" (D2) loại bỏ khả năng dùng một parser cứng.** Cần cơ chế **nhiều chiến lược nhận diện + điểm tin cậy + cờ cảnh báo**, kèm khả năng admin **chỉ định dạng đáp án khi tải lên** (hoặc để hệ thống tự đoán rồi admin xác nhận).
3. **PDF scan khó nhận diện đáp án đánh dấu bằng định dạng** (in đậm, tô màu, dấu `*`) vì OCR thường mất thông tin này. Với PDF scan, nhiều khả năng đáp án phải lấy từ bảng đáp án rời hoặc admin tự chọn.
4. **Dùng OCR/AI đám mây (D4) làm nội dung đề thi rời khỏi hệ thống.** Cần xác nhận chính sách bảo mật đề thi và chi phí (xem Q3, Q4).
5. Chức năng này **tác động trực tiếp đến thiết kế bài thi** đã đề xuất trong báo cáo đánh giá trước (QZ-01 lưu đề đã phát, QZ-03 kích thước ngân hàng tối thiểu, QZ-05 phiên bản hóa câu hỏi). Nên làm **cùng** thiết kế `quiz_attempts`, không làm riêng.

---

## 3. KIẾN TRÚC TÍNH NĂNG

### 3.1. Sơ đồ thành phần 💡

```
 Admin (trình duyệt)
   │  1. Tải PDF (upload trực tiếp lên R2/S3 bằng presigned URL)
   │  2. Tạo import job
   ▼
 Backend API (Express) ──► MongoDB (import_jobs, question_sets, questions[draft])
   │                          ▲
   │ 3. Đẩy job vào hàng đợi  │ 6. Lưu câu hỏi nháp + cờ cảnh báo
   ▼                          │
 Redis + BullMQ ──► Worker xử lý PDF (tiến trình riêng, KHÔNG chạy trong API)
                      │ 4a. PDF có text → trích xuất text/định dạng → parser
                      │ 4b. PDF scan → (Đường A) OCR/AI đám mây  | (Đường B) admin nhập tay/công cụ ngoài
                      │ 5. Chuẩn hóa Unicode NFC, tách câu, nhận diện đáp án, tính độ tin cậy
                      ▼
 Admin duyệt nháp (so sánh PDF ↔ dữ liệu) ──► Câu "approved" mới được dùng ở bài thi

 Cấu hình đề (exam_configs) ──► Khi sinh viên bắt đầu thi: bốc ngẫu nhiên từ các câu approved
                                  ──► lưu bản chụp đề đã phát vào quiz_attempts
```

### 3.2. Lý do tách worker riêng 💡
Parse PDF/OCR tốn CPU/RAM và có thể kéo dài hàng chục giây. Chạy trong tiến trình API sẽ làm nghẽn heartbeat/đăng nhập của sinh viên (liên quan SEC-05, mục 2.9 báo cáo trước). Dùng hàng đợi (BullMQ + Redis) cho phép giới hạn song song, thử lại, theo dõi tiến độ.

> ❓ **Công nghệ parse PDF** (Node `pdfjs-dist` hay dịch vụ Python với PyMuPDF/pdfplumber): ảnh hưởng ngôn ngữ và độ phức tạp triển khai. Xem Q10.

---

## 4. MÔ HÌNH DỮ LIỆU ĐỀ XUẤT 💡

> Mở rộng/thay thế collection `questions` ở mục 3.4 của tài liệu kiến trúc v1.0. Chi tiết trường có thể điều chỉnh khi chốt các câu hỏi ❓.

### 4.1. `question_sets` (Bộ câu hỏi, một mục trong ngân hàng)
```javascript
{
  _id: ObjectId,
  name: String,                          // Tên bộ (VD: "Bộ câu hỏi QPAN - Chương 1")
  description: String,
  courseIds: [ObjectId],                 // ❓ Q8: gắn khóa học ở cấp bộ hay cấp câu?
  source: { type: String, enum: ['pdf', 'manual', 'excel'] },
  importJobId: ObjectId,                 // Nếu nhập từ PDF
  originalFileKey: String,               // Đường dẫn PDF gốc trên R2/S3 (❓ Q9: có lưu hay xóa)
  status: { type: String, enum: ['draft', 'in_review', 'approved', 'archived'] },
  questionCounts: { total: Number, approved: Number, flagged: Number },
  createdBy: ObjectId, approvedBy: ObjectId,
  createdAt: Date, updatedAt: Date, approvedAt: Date
}
```

### 4.2. `questions` (mở rộng)
```javascript
{
  _id: ObjectId,
  setId: { type: ObjectId, ref: 'QuestionSet', index: true },
  orderInSet: Number,                    // Số thứ tự trong PDF gốc
  text: String,                          // Nội dung câu hỏi (chuẩn hóa Unicode NFC)
  choices: [{ id: String, text: String }],   // Mảng thay vì cố định A-D (xem QZ-09)
  correctIds: [String],                  // Chỉ lưu ở server, KHÔNG gửi xuống sinh viên
  explanation: String,
  status: { type: String, enum: ['draft', 'needs_review', 'approved', 'rejected', 'archived'], index: true },
  version: Number,                       // Tăng khi sửa sau khi đã duyệt (QZ-05)
  parse: {                               // Siêu dữ liệu từ quá trình đọc PDF
    page: Number, bbox: [Number],        // Vị trí trong PDF, phục vụ đối chiếu khi duyệt
    answerStrategy: String,              // 'inline_bold' | 'inline_color' | 'inline_mark' | 'answer_table' | 'manual' | ...
    confidence: Number,                  // 0..1
    flags: [String]                      // 'no_answer','few_choices','duplicate','low_ocr','multi_answer','has_image'
  },
  dedupHash: { type: String, index: true },  // Băng cho phát hiện câu trùng (❓ Q6)
  imageKeys: [String],                   // ❓ Q5: hỗ trợ hình ảnh trong câu hỏi?
  tags: [String], difficulty: Number,    // ❓ Q7: có cần phân loại độ khó/chủ đề?
  active: Boolean
}
```
**Ràng buộc nghiệp vụ 💡:** một câu chỉ được vào đề khi `status = approved` **và** có ít nhất một `correctIds` **và** bộ chứa nó không `archived`.

### 4.3. `import_jobs`
```javascript
{
  _id: ObjectId,
  setId: ObjectId,
  fileKey: String, fileName: String, fileSize: Number, pageCount: Number,
  pdfKind: { type: String, enum: ['text', 'scan', 'mixed', 'unknown'] },   // Phát hiện từng trang
  mode: { type: String, enum: ['text_parse', 'cloud_ocr', 'manual'] },     // Theo D4
  answerFormat: { type: String, enum: ['auto', 'inline_mark', 'answer_table', 'none', 'custom'] },
  status: { type: String, enum: ['uploaded', 'queued', 'processing', 'parsed', 'failed', 'cancelled'] },
  progress: { page: Number, total: Number },
  stats: { questionsFound: Number, withAnswer: Number, flagged: Number, avgConfidence: Number },
  errors: [{ page: Number, code: String, message: String }],
  createdBy: ObjectId, createdAt: Date, finishedAt: Date
}
```

### 4.3.1. `exam_configs` (cấu hình đề random, theo D6)
```javascript
{
  _id: ObjectId,
  courseId: ObjectId,                    // (❓ Q1: gắn ở cấp khóa hay cấp bài)
  totalQuestions: Number,                // Số câu mỗi đề
  sources: [{                            // Nguồn bốc câu hỏi
    setId: ObjectId,
    quota: Number,                       // Số câu bốc từ bộ này (hoặc tỉ lệ, ❓ Q1)
  }],
  manualPool: [ObjectId],                // ❓ Q1: câu chọn tay đưa vào nguồn bốc (nếu giữ chức năng chọn thủ công)
  shuffleQuestions: Boolean, shuffleChoices: Boolean,
  avoidRepeatFromPrevious: Boolean,      // ❓ Q12: ưu tiên câu chưa gặp khi làm lại
  passScore: Number,                     // Đồng bộ với courses.passScore
  status: { type: String, enum: ['draft', 'active', 'archived'] },
  validation: { poolSize: Number, warnings: [String] },
  updatedBy: ObjectId, updatedAt: Date
}
```

### 4.4. `quiz_attempts` (điều chỉnh theo báo cáo đánh giá trước)
Mỗi lượt thi **lưu bản chụp đề đã phát** để chống sửa/xóa câu hỏi làm sai lịch sử (QZ-01, QZ-05):
```javascript
{
  userId, courseId, examConfigId, status: 'in_progress' | 'submitted' | 'expired',
  startedAt, expiresAt, submittedAt, score, passed,
  items: [{ questionId, questionVersion, snapshot: { text, choices(thứ tự đã xáo) }, selectedIds, isCorrect }]
}
```

### 4.5. Chỉ mục cần có
`questions (setId, status)`, `questions (status, active)`, `questions (dedupHash)`, `question_sets (status)`, `import_jobs (createdBy, status)`, `exam_configs (courseId, status)`, unique `(userId, courseId, status='in_progress')` cho attempt đang làm.

---

## 5. NHẬP PDF: THIẾT KẾ CHI TIẾT

### 5.1. Quy trình theo từng bước 💡

| Bước | Hành động | Ghi chú |
|---|---|---|
| 1 | Admin chọn/tải PDF, đặt tên bộ, (tùy chọn) chọn **dạng đáp án** | Upload thẳng lên R2/S3; kiểm tra loại file, kích thước (❓ Q9) |
| 2 | Hệ thống **phát hiện từng trang** có lớp text hay là ảnh | Một PDF có thể trộn cả hai (D1) |
| 3 | Chọn đường xử lý theo D4 (xem 5.3) | Admin có thể ép chế độ |
| 4 | Worker trích xuất → tách câu hỏi → nhận diện đáp án | Mục 5.2 |
| 5 | Lưu **nháp** + cờ cảnh báo + độ tin cậy (D5) | `status=draft/needs_review` |
| 6 | Admin xem màn hình đối chiếu, sửa, duyệt | Mục 5.5 |
| 7 | Duyệt xong → `approved`, mới dùng được trong đề | Ghi `approvedBy/At` |

### 5.2. Bộ nhận diện (parser) cho "nhiều dạng đáp án" (D2) 💡

Dùng mẫu thiết kế **Strategy**: chạy lần lượt nhiều chiến lược, mỗi chiến lược trả về đáp án + độ tin cậy; lấy kết quả tốt nhất, và **gắn cờ khi các chiến lược mâu thuẫn hoặc không có kết quả**.

| Mã | Dạng đáp án trong PDF | Cách nhận diện | PDF có text | PDF scan |
|---|---|---|:---:|:---:|
| A1 | Chữ **in đậm** | Đọc cờ font bold từ lớp text | ✅ Tốt | ⚠️ OCR thường mất |
| A2 | **Tô màu / highlight** | Đọc màu chữ, hình chữ nhật nền | ✅ | ⚠️ Cần xử lý ảnh/AI thị giác |
| A3 | Dấu `*`, `✓`, `(đúng)`, gạch chân | Mẫu regex/ký tự | ✅ | ⚠️ Tùy chất lượng ảnh |
| A4 | **Bảng đáp án** cuối file / cuối phần (`1-A, 2-C…`) | Phát hiện bảng, ghép theo số câu | ✅ | ⚠️ OCR + ghép |
| A5 | Đáp án đúng luôn là A (đề đã đảo) hoặc có dòng "Đáp án: B" ngay dưới câu | Mẫu dòng | ✅ | ✅ |
| A6 | **Không có đáp án** | Để trống, gắn cờ `no_answer` | ✅ | ✅ |

Quy tắc an toàn 💡:
- Không đoán bừa: nếu độ tin cậy dưới ngưỡng hoặc nhiều đáp án mâu thuẫn → `needs_review`, **không** tự đặt đáp án.
- Câu `no_answer` bị **khóa khỏi đề** cho đến khi admin chọn đáp án.
- Lưu `answerStrategy` để thống kê chiến lược nào hay sai và cải tiến.

### 5.3. Đường xử lý PDF scan (D4: kết hợp đám mây và không OCR) 💡

| Đường | Mô tả | Ưu điểm | Nhược điểm / rủi ro | Cần chốt |
|---|---|---|---|---|
| **B1: OCR/AI đám mây** | Gửi trang ảnh tới dịch vụ OCR/AI, nhận văn bản (và có thể cấu trúc câu hỏi) | Chính xác hơn với tiếng Việt, ít công admin | **Tốn phí**, đề thi **rời khỏi hệ thống**, phụ thuộc dịch vụ, có thể sai ở dấu/đáp án đánh dấu | ❓ Q3 (nhà cung cấp, ngân sách), ❓ Q4 (chính sách bảo mật đề) |
| **B2: Không OCR** | Admin nhập tay vào form, hoặc dán văn bản từ công cụ ngoài, hoặc tải **Excel/CSV/JSON theo mẫu** | Không tốn phí, kiểm soát dữ liệu tuyệt đối | Tốn công admin, dễ nhập sai | ❓ Q11 (có cần mẫu Excel/JSON?) |

Đề xuất vận hành 💡: mặc định hiển thị **cả hai lựa chọn** khi hệ thống phát hiện trang scan, kèm cảnh báo về chi phí/bảo mật của B1; admin tự chọn cho từng file. Hệ thống ghi nhận `mode` của từng job.

> ⚠️ Mục B1 chỉ nên bật sau khi **Q3/Q4 được trả lời**. Nếu chưa, hệ thống mặc định B2.

### 5.4. Xử lý chất lượng dữ liệu 💡
- Chuẩn hóa Unicode **NFC**, loại bỏ ký tự điều khiển, chuẩn hóa khoảng trắng, nối dòng bị ngắt giữa câu.
- Kiểm tra tự động: số lựa chọn (≥ 2, thường 4), đáp án thuộc danh sách lựa chọn, câu quá ngắn/quá dài, ký tự lạ (dấu hiệu lỗi OCR), số thứ tự câu liên tục (phát hiện câu bị mất).
- Phát hiện trùng: băm văn bản đã chuẩn hóa; cảnh báo trùng trong cùng bộ và với ngân hàng hiện có (❓ Q6: chặn, cảnh báo hay bỏ qua).
- Câu có **hình ảnh/công thức/bảng**: gắn cờ `has_image` (❓ Q5: hỗ trợ hay chỉ cảnh báo).
- Giới hạn an toàn: kích thước tệp, số trang, **timeout** từng trang, giới hạn bộ nhớ worker, chạy parser trong tiến trình cô lập (tránh PDF độc hại).

### 5.5. Giao diện duyệt nháp của admin 💡

| Thành phần | Nội dung |
|---|---|
| Danh sách bộ | Tên, nguồn, trạng thái (nháp/đã duyệt), số câu, số câu có cảnh báo, ngày tạo |
| Trang kết quả đọc | Thanh tiến độ job; thống kê: tìm thấy N câu, M câu có đáp án, K câu cảnh báo |
| **Đối chiếu song song** | Trái: trang PDF gốc (đánh dấu vùng câu hỏi); phải: dữ liệu đã đọc, sửa trực tiếp |
| Bộ lọc | Chỉ hiện câu có cảnh báo / chưa có đáp án / độ tin cậy thấp / trùng |
| Thao tác | Sửa nội dung, chọn đáp án đúng, thêm/xóa lựa chọn, tách/gộp câu, xóa câu, duyệt từng câu hoặc hàng loạt |
| Duyệt bộ | Chỉ cho phép duyệt bộ khi không còn câu `no_answer` (hoặc admin xác nhận loại bỏ chúng) |
| Nhật ký | Ai sửa gì, khi nào (liên quan SEC-06 audit log) |

---

## 6. TẠO ĐỀ: CHỌN THỦ CÔNG & RANDOM

### 6.1. Cấu hình đề random theo D6 💡
Admin cấu hình cho từng khóa học/bài thi (❓ Q1):
- **Số câu mỗi đề** (tương ứng `totalQuestionsPerQuiz`).
- **Nguồn bốc:** một hoặc nhiều bộ câu hỏi đã duyệt, kèm **hạn mức mỗi bộ** (số câu hoặc tỉ lệ).
- Tùy chọn: xáo thứ tự câu, xáo thứ tự đáp án, ưu tiên câu chưa gặp khi làm lại (❓ Q12).
- **Kiểm tra cấu hình khi lưu:** đủ câu `approved` để bốc; cảnh báo nếu ngân hàng quá nhỏ (đề xuất tối thiểu 3-5 lần số câu/đề, theo QZ-03); cảnh báo nếu hạn mức vượt số câu có sẵn.

### 6.2. Thuật toán bốc đề 💡
1. Khi sinh viên bấm bắt đầu thi (`POST /quiz/start`): lấy danh sách `questionId` đủ điều kiện (đã duyệt, có đáp án, bộ không lưu trữ), theo từng nguồn.
2. Với mỗi nguồn: bốc ngẫu nhiên đúng hạn mức bằng **lấy mẫu không lặp** (Fisher-Yates hoặc `$sample`), dùng bộ sinh số ngẫu nhiên an toàn (`crypto`).
3. Ghép, xáo thứ tự (nếu bật), xáo đáp án (lưu ánh xạ để chấm).
4. **Lưu bản chụp đề vào `quiz_attempts`** trước khi trả về client (QZ-01); client **không nhận** `correctIds`.
5. Nếu số câu đủ điều kiện < yêu cầu: **không tự hạ số câu**, trả lỗi cấu hình và báo admin (❓ Q12 nếu muốn hành vi khác).

Hiệu năng: với vài nghìn câu, nạp danh sách ID vào Redis hoặc bộ nhớ đệm ngắn hạn; mỗi lượt bốc chỉ vài mili-giây. Khớp kịch bản nộp/bắt đầu đồng loạt (L3, mục 5.4 báo cáo trước).

### 6.3. Vai trò của "chọn thủ công" (❓ Q1: chưa quyết định) 

Yêu cầu gốc có "chọn thủ công", nhưng D6 chốt "random cho từng sinh viên". Các phương án để bạn chọn:

| Phương án | Mô tả | Ưu | Nhược |
|---|---|---|---|
| **P1: Chọn tay để tạo "nguồn bốc"** | Admin tích chọn câu cụ thể (từ nhiều bộ) đưa vào một **nhóm nguồn**, hệ thống bốc random trong nhóm đó | Linh hoạt, kiểm soát nội dung, vẫn mỗi sinh viên một đề | Thêm một khái niệm "nhóm nguồn" |
| **P2: Đề cố định thêm vào** | Ngoài random, có loại đề **cố định** (admin chọn tay, ai cũng làm giống nhau) | Phù hợp kỳ thi chính thức cần đề chung | Trái với D6 nếu D6 áp dụng cho mọi đề; thêm một loại đề |
| **P3: Bỏ chọn thủ công** | Chỉ random theo bộ/hạn mức | Đơn giản nhất | Không thể loại một vài câu cụ thể khỏi đề (trừ cách lưu trữ câu đó) |
| **P4: Kết hợp** | "Bắt buộc" (câu admin chọn tay luôn có trong đề) + "ngẫu nhiên" (phần còn lại bốc từ bộ) | Cân bằng kiểm soát và đa dạng | Phức tạp hơn khi cấu hình và kiểm thử |

> Kế hoạch **không chọn thay** bạn. Khung dữ liệu `exam_configs` ở 4.3.1 đã chừa chỗ cho `manualPool`; sẽ chốt sau khi bạn trả lời Q1.

---

## 7. API ĐỀ XUẤT 💡 (chỉ dành cho Admin)

| Nhóm | Endpoint | Mô tả |
|---|---|---|
| Bộ câu hỏi | `GET/POST /api/admin/question-sets` | Danh sách, tạo bộ (thủ công/Excel) |
| | `GET/PATCH/DELETE /api/admin/question-sets/:id` | Xem, đổi tên, lưu trữ (soft delete) |
| | `POST /api/admin/question-sets/:id/approve` | Duyệt cả bộ (kiểm tra điều kiện) |
| Câu hỏi | `GET/POST /api/admin/questions` | Lọc theo bộ/trạng thái/cờ, thêm câu thủ công |
| | `PATCH /api/admin/questions/:id` | Sửa (tăng `version` nếu đã duyệt) |
| | `POST /api/admin/questions/bulk` | Duyệt/từ chối/xóa hàng loạt |
| Nhập PDF | `POST /api/admin/imports/init` | Tạo job, cấp presigned URL upload PDF |
| | `POST /api/admin/imports/:id/start` | Bắt đầu xử lý (chọn `mode`, `answerFormat`) |
| | `GET /api/admin/imports/:id` | Tiến độ, thống kê, lỗi |
| | `POST /api/admin/imports/:id/cancel` | Hủy |
| | `GET /api/admin/imports/:id/pages/:n` | Ảnh/URL trang PDF để đối chiếu |
| Nhập thủ công | `POST /api/admin/question-sets/:id/import-file` | Excel/CSV/JSON theo mẫu (❓ Q11) |
| Cấu hình đề | `GET/PUT /api/admin/courses/:id/exam-config` | Cấu hình nguồn, hạn mức, tùy chọn |
| | `POST /api/admin/exam-config/:id/validate` | Kiểm tra đủ câu, cảnh báo |
| | `POST /api/admin/exam-config/:id/preview` | Bốc **thử** một đề (xem mẫu, không ghi nhận) |
| Sinh viên | `POST /api/courses/:id/quiz/start` | Bốc đề theo cấu hình, lưu bản chụp (QZ-01) |

Quyền hạn: chỉ vai trò Admin (D3); ❓ Q13: mọi admin đều thấy/sửa mọi bộ hay chỉ người tạo và superadmin.

---

## 8. ẢNH HƯỞNG TỚI TÀI LIỆU KIẾN TRÚC v1.0

| Mục trong v1.0 | Thay đổi cần làm |
|---|---|
| 3.4 `questions` | Thay bằng mô hình ở mục 4 (thêm `setId`, `status`, `version`, `choices` dạng mảng) |
| 3.6 `quiz_attempts` | Thêm `status`, `items[]` có bản chụp đề (mục 4.4) |
| 4.1 bước 4 ("bốc ngẫu nhiên 10 câu") | Thay bằng bốc theo `exam_configs` (mục 6) |
| 4.2 bước 5 (CRUD câu hỏi, import Excel) | Mở rộng thành quản lý bộ + nhập PDF + duyệt nháp |
| 5 (cấu trúc thư mục) | Thêm `workers/pdfImport/`, `services/pdfParser/`, `services/examBuilder.ts`, `models/QuestionSet`, `ImportJob`, `ExamConfig` |
| 6 (triển khai) | Thêm **Redis + worker**; cân nhắc tài nguyên VPS (RAM cho parse/OCR) |
| Bảo mật (SEC-09/12) | Thêm kiểm soát upload PDF, cách ly parser, giới hạn kích thước |

---

## 9. KẾ HOẠCH KIỂM THỬ

### 9.1. Bộ dữ liệu thử PDF (corpus) 💡
Tạo bộ PDF mẫu cho **từng dạng đáp án** (A1-A6, mục 5.2) và từng loại tệp (text, scan chất lượng tốt/kém, nghiêng, mờ, trộn trang, nhiều cột, có hình/bảng, nhiều bộ trong một file). **Cần admin cung cấp file thật** làm mẫu (❓ Q14).

### 9.2. Chỉ số chất lượng parse (đo được)

| Chỉ số | Cách đo | Ngưỡng đề xuất (❓ cần duyệt) |
|---|---|---|
| Recall tách câu | Số câu đọc đúng / tổng câu thật | PDF text ≥ 98%, PDF scan ≥ 90% |
| Chính xác nội dung câu | Tỉ lệ ký tự sai (CER) sau chuẩn hóa | PDF text ≤ 0.5%, scan ≤ 3% |
| Chính xác đáp án (khi nhận diện được) | Đáp án đúng / số câu có đáp án | ≥ 99% ở chiến lược "tin cậy cao" |
| Tỉ lệ gắn cờ đúng | Câu sai đều được gắn cờ | ≥ 95% câu sai có cờ (mục tiêu: **sai thì phải bị gắn cờ**) |

### 9.3. Kịch bản kiểm thử chính

| ID | Khu vực | Kịch bản | Kết quả mong đợi |
|---|---|---|---|
| TC-PDF-01 | Nhập PDF | PDF text chuẩn, đáp án in đậm | Đọc đúng, `answerStrategy=inline_bold`, trạng thái nháp |
| TC-PDF-02 | Nhập PDF | PDF có bảng đáp án cuối file | Ghép đúng theo số câu |
| TC-PDF-03 | Nhập PDF | PDF không có đáp án | Mọi câu `no_answer`, **không dùng được trong đề** |
| TC-PDF-04 | Nhập PDF | Hai chiến lược cho kết quả mâu thuẫn | Gắn cờ, không tự quyết |
| TC-PDF-05 | Nhập PDF | PDF trộn trang text và trang scan | Phát hiện từng trang, xử lý đúng đường |
| TC-PDF-06 | OCR | Scan chất lượng thấp/nghiêng | Điểm tin cậy thấp, gắn cờ `low_ocr` |
| TC-PDF-07 | OCR | Dấu tiếng Việt (ă, â, ê, ô, ơ, ư, đ, thanh điệu) | Sai dấu được phát hiện hoặc đo CER trong ngưỡng |
| TC-PDF-08 | Bảo mật | PDF quá lớn / quá nhiều trang / bị hỏng / có script / không phải PDF | Từ chối an toàn, không treo worker |
| TC-PDF-09 | Bảo mật | Đổi đuôi `.exe` thành `.pdf` | Bị chặn do kiểm tra nội dung thật |
| TC-PDF-10 | Hiệu năng | Hủy job giữa chừng; worker bị kill | Job chuyển `cancelled/failed`, có thể thử lại, không tạo câu rác |
| TC-PDF-11 | Nhập PDF | Nhập lại cùng một PDF | Cảnh báo trùng theo chính sách (❓ Q6) |
| TC-REV-01 | Duyệt | Duyệt bộ còn câu chưa có đáp án | Bị chặn hoặc yêu cầu xác nhận loại bỏ |
| TC-REV-02 | Duyệt | Câu `draft` có xuất hiện trong đề không | **Không bao giờ** xuất hiện |
| TC-REV-03 | Duyệt | Sửa câu đã duyệt | Tăng `version`; lịch sử bài thi cũ không đổi |
| TC-RND-01 | Random | Bốc 1.000 đề liên tiếp từ bộ 100 câu, N=10 | Phân bố mỗi câu xấp xỉ đều (kiểm định thống kê, vd. χ²) |
| TC-RND-02 | Random | Hạn mức nhiều bộ (vd. 4+3+3) | Đúng số câu mỗi bộ, không trùng câu trong đề |
| TC-RND-03 | Random | Pool nhỏ hơn số câu yêu cầu | Lỗi cấu hình rõ ràng, không hạ số câu ngầm |
| TC-RND-04 | Random | Hai sinh viên bắt đầu thi cùng lúc | Đề khác nhau; mỗi attempt có bản chụp riêng |
| TC-RND-05 | Random | Xáo đáp án rồi chấm | Chấm đúng theo ánh xạ sau xáo |
| TC-RND-06 | Random | Câu bị lưu trữ/sửa sau khi đã phát cho sinh viên đang thi | Bài đang làm không bị ảnh hưởng |
| TC-RND-07 | Bảo mật | Response `/quiz/start` | Không chứa `correctIds`, `explanation` |
| TC-RND-08 | Tải | 1.000 sinh viên bắt đầu thi trong vài phút | p95 bốc đề ≤ 200 ms, không lỗi |
| TC-AUTHZ-10 | Phân quyền | Student gọi API `/api/admin/question-sets`, `imports` | 403 |
| TC-CFG-01 | Cấu hình | Cấu hình hạn mức vượt số câu có sẵn; ngân hàng quá nhỏ | Cảnh báo khi lưu |

---

## 10. RỦI RO

| # | Rủi ro | Khả năng | Ảnh hưởng | Biện pháp |
|---|---|:---:|:---:|---|
| R1 | Parser đọc sai đáp án mà không bị phát hiện → sinh viên bị chấm sai | Trung bình | Rất cao | Nháp bắt buộc duyệt (D5), không đoán bừa, cờ cảnh báo, đo chỉ số 9.2 |
| R2 | Nhiều dạng đáp án (D2) khiến parser không bao phủ hết | Cao | Cao | Strategy pattern, admin chỉ định dạng, thu thập file mẫu sớm, mở rộng dần |
| R3 | OCR tiếng Việt sai dấu/ký tự | Cao | Trung bình | Duyệt nháp, đo CER, cờ `low_ocr`, đường B2 thay thế |
| R4 | Lộ đề khi gửi lên OCR/AI đám mây | Trung bình | Cao | Q4 chính sách, hợp đồng nhà cung cấp, mặc định B2, ghi log |
| R5 | Chi phí OCR/AI đám mây vượt dự kiến | Trung bình | Trung bình | Q3 ngân sách, hạn mức trang/tháng, xác nhận trước khi chạy |
| R6 | Parse chiếm tài nguyên làm chậm hệ thống học tập | Trung bình | Cao | Worker + hàng đợi, giới hạn song song, giới hạn bộ nhớ |
| R7 | PDF độc hại/tệp lạ | Thấp-Trung bình | Cao | Kiểm tra nội dung, cách ly parser, timeout, giới hạn |
| R8 | Ngân hàng nhỏ → đề giống nhau, dễ lan truyền đáp án | Trung bình | Trung bình | Cảnh báo kích thước pool, ưu tiên câu chưa gặp |
| R9 | Sửa/xóa câu sau khi có người thi làm sai lịch sử | Trung bình | Cao | Phiên bản hóa + bản chụp trong attempt |
| R10 | Trùng câu giữa các bộ → câu lặp trong một đề hoặc phân bố lệch | Trung bình | Thấp-Trung bình | Phát hiện trùng, quy tắc không lặp trong đề |
| R11 | Yêu cầu còn mơ hồ ("chọn thủ công") dẫn đến làm lại | Cao | Trung bình | Chốt Q1 trước khi thiết kế UI cấu hình đề |

---

## 11. LỘ TRÌNH & ƯỚC LƯỢNG SƠ BỘ 💡

> Ước lượng thô cho nhóm 2-3 người, **chỉ để tham khảo**, phụ thuộc vào câu trả lời ❓ và chất lượng file mẫu.

| Giai đoạn | Nội dung | Phụ thuộc | Ước lượng |
|---|---|---|---|
| **G0** | Chốt các ❓ ở mục 12, thu thập 10-20 file PDF mẫu thật | Người yêu cầu | 3-5 ngày |
| **G1** | Mô hình dữ liệu, CRUD bộ câu hỏi/câu hỏi, trạng thái, duyệt tay, nhập Excel/JSON (đường B2) | G0 | 1-1.5 tuần |
| **G2** | Hạ tầng worker + BullMQ + Redis, upload PDF, phát hiện trang text/scan, parser **PDF text** (A1-A6) | G1 | 2-3 tuần |
| **G3** | Giao diện duyệt nháp đối chiếu song song | G2 | 1-1.5 tuần |
| **G4** | `exam_configs`, thuật toán bốc đề, bản chụp attempt, preview đề (kèm `quiz_attempts` mới) | G1 | 1-1.5 tuần (làm song song G2) |
| **G5** | Đường OCR/AI đám mây (B1) cho PDF scan | G2, Q3/Q4 | 1.5-2 tuần |
| **G6** | Kiểm thử corpus, đo chỉ số, load test bốc đề, bảo mật upload | Tất cả | 1-1.5 tuần |

Gợi ý phát hành theo đợt: **MVP = G1 + G4** (có ngân hàng, nhập Excel/JSON, random theo cấu hình), sau đó **G2-G3** (PDF text), cuối cùng **G5** (PDF scan, vì rủi ro cao và phụ thuộc quyết định chi phí/bảo mật).

---

## 12. QUYẾT ĐỊNH CÒN MỞ (❓): CẦN NGƯỜI YÊU CẦU TRẢ LỜI

> Kế hoạch **không tự chọn** các mục dưới đây. Mỗi mục có phương án để tham khảo.

| # | Câu hỏi | Phương án | Ảnh hưởng |
|---|---|---|---|
| **Q1** | Sau khi chốt "random mỗi sinh viên một đề" (D6), **"chọn thủ công" dùng để làm gì**? Cấu hình đề gắn ở cấp khóa hay cấp bài? | P1 nhóm nguồn chọn tay · P2 đề cố định thêm · P3 bỏ · P4 bắt buộc + ngẫu nhiên (mục 6.3) | `exam_configs`, giao diện cấu hình, kiểm thử |
| **Q2** | "Bộ câu hỏi" có phân cấp (ngân hàng → môn/chương → bộ) hay phẳng? | Phẳng · 2 cấp · gắn thẻ chủ đề | Mô hình dữ liệu, UI |
| **Q3** | OCR/AI đám mây: **dùng nhà cung cấp nào, ngân sách/tháng bao nhiêu, giới hạn số trang?** | Do bạn chỉ định; hoặc hệ thống liệt kê lựa chọn để bạn quyết | Chi phí, G5 |
| **Q4** | Đề thi có **được phép gửi ra dịch vụ bên ngoài** không (nhà cung cấp, quốc gia lưu trữ)? | Cho phép · Cấm hoàn toàn · Chỉ một số bộ được gửi | Có bật B1 hay chỉ B2; pháp lý (LEG-02) |
| **Q5** | Câu hỏi có **hình ảnh/công thức/bảng** không? Có cần hỗ trợ? | Chỉ văn bản · Hỗ trợ hình (lưu ảnh cắt từ PDF) · Chỉ cảnh báo | Mô hình, parser, UI học, độ phức tạp tăng đáng kể |
| **Q6** | Khi **phát hiện câu trùng**: chặn, cảnh báo, hay bỏ qua? Trùng so với trong bộ hay cả ngân hàng? | Chặn · Cảnh báo cho admin quyết · Bỏ qua | Parser, UI duyệt |
| **Q7** | Có cần **độ khó / chủ đề / thẻ** để random theo tỉ lệ (vd. 30% dễ, 70% trung bình)? | Không · Chỉ chủ đề · Độ khó + chủ đề | `exam_configs`, parser, UI duyệt |
| **Q8** | Gắn bộ câu hỏi với khóa học ở **cấp bộ**, **cấp câu**, hay chỉ ở **cấu hình đề**? | Cấp bộ · Cấp câu · Chỉ cấu hình đề | Truy vấn, tái sử dụng bộ cho nhiều khóa |
| **Q9** | Giới hạn **kích thước/số trang** PDF; có **lưu giữ PDF gốc** sau khi nhập không, và trong bao lâu? | Giữ vĩnh viễn · Giữ N ngày · Xóa sau duyệt | Dung lượng, kiểm tra đối chiếu, pháp lý |
| **Q10** | Công nghệ worker parse: **Node** (pdfjs-dist) hay **Python** (PyMuPDF/pdfplumber)? Đội dev quen ngôn ngữ nào? | Node · Python · Hỗ trợ cả hai | Triển khai, độ chính xác đọc định dạng (đậm/màu) |
| **Q11** | Đường B2 (không OCR): cần **biểu mẫu Excel/CSV/JSON**, **form nhập tay**, **dán văn bản** hay đủ cả? | Chọn một hoặc nhiều | Phạm vi G1 |
| **Q12** | Khi làm lại bài: **ưu tiên câu chưa gặp**, không lặp câu liên lượt, hay hoàn toàn ngẫu nhiên? Nếu pool thiếu câu thì **báo lỗi** hay giảm số câu? | Theo từng phương án | Thuật toán bốc, `quiz_attempts` |
| **Q13** | **Phân quyền**: mọi admin thấy/sửa mọi bộ, hay chỉ người tạo + superadmin? Ai được **duyệt** (người nhập khác người duyệt)? | Mở · Theo chủ sở hữu · Tách vai trò nhập/duyệt | RBAC, audit |
| **Q14** | Có thể cung cấp **10-20 file PDF thật** (đủ các dạng đáp án, cả text và scan) để làm corpus kiểm thử? | Có · Chỉ vài file · Không | Chất lượng parser, G0/G6 |
| **Q15** | Loại câu hỏi: chỉ **một đáp án đúng** (A-D) hay có **nhiều đáp án**, đúng/sai, điền khuyết? Số lựa chọn từ 2 đến mấy? | Một đáp án · Nhiều đáp án · Đúng/Sai | Mô hình, chấm điểm, parser |
| **Q16** | Có cần **giải thích đáp án** (explanation)? Sau khi nộp có hiển thị đáp án đúng cho sinh viên không (QZ-06)? | Theo từng phương án | Mô hình, bảo mật, UI học |
| **Q17** | **Dữ liệu câu hỏi hiện có** (nếu đã có trong hệ thống/Excel cũ): cần di chuyển (migrate) vào ngân hàng mới không? | Có · Không, làm mới | Phạm vi G1, kịch bản migration |
| **Q18** | Ưu tiên giai đoạn nào trước (ví dụ MVP nhanh hay đầy đủ PDF scan)? Thời hạn mong muốn? | Theo mục 11 | Lộ trình, nhân lực |

---

## 13. TIÊU CHÍ NGHIỆM THU (ĐỀ XUẤT 💡)

- Chỉ câu `approved` có đáp án mới xuất hiện trong đề; **không có đường nào** để câu nháp lọt vào đề (đã test).
- Mỗi lượt thi lưu bản chụp đề; sửa/lưu trữ câu hỏi sau đó **không làm đổi** kết quả cũ.
- Với bộ PDF mẫu của trung tâm, đạt các chỉ số mục 9.2 (hoặc ngưỡng được duyệt); câu đọc sai đều bị gắn cờ.
- Bốc đề: phân bố đều theo kiểm định; đúng hạn mức; không trùng câu trong đề; p95 ≤ 200 ms ở tải mục tiêu.
- Upload PDF an toàn (từ chối tệp lỗi/độc hại), worker không làm chậm API trong test tải hỗn hợp.
- Admin hoàn thành quy trình **tải PDF → xem kết quả → sửa → duyệt → cấu hình đề → xem thử đề** mà không cần hỗ trợ kỹ thuật (UAT).

---

*— Hết tài liệu. Khi các mục ❓ ở mục 12 được trả lời, kế hoạch sẽ được cập nhật lên v1.1 để chốt thiết kế chi tiết. —*
