import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { Question } from '../models/Question.model.js';

// Load .env
dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/elearning_gdqpan?directConnection=true';

export async function runCourseSeed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Đã kết nối MongoDB thành công.');

  // KHỞI TẠO KHÓA HỌC: "Nghiệp vụ Quản lý & Quán triệt Sinh viên GDQP&AN"
  console.log('Đang khởi tạo Khóa học Nghiệp vụ Quản lý & Quán triệt Sinh viên...');
  const courseCode = 'GDQP-QLSV';
  let course = await Course.findOne({ code: courseCode });
  if (!course) {
    course = await Course.create({
      code: courseCode,
      title: 'Nghiệp vụ Quản lý & Quán triệt Sinh viên GDQP&AN',
      description:
        'Chương trình học tập, rèn luyện và quán triệt đầu khóa học dành cho Sinh viên học tập trung tại Trung tâm GDQP&AN ĐHQG-HCM theo quy chế quản lý quân sự.',
      active: true,
      totalLessons: 6,
    });
  }

  const lessonsData = [
    {
      order: 1,
      title: 'Bài 1: Tổ chức biên chế lớp học & Quán triệt chức trách cán bộ đại đội',
      videoKey: '7.Tran Ngoc Hoa.mp4',
      videoDurationSeconds: 295,
      passScore: 8,
      questions: [
        {
          text: 'Theo quy định tại Trung tâm, Đại đội phó học tập có trách nhiệm thực hiện nhiệm vụ nào sau đây?',
          choices: [
            {
              id: 'A',
              text: 'Cùng Đại đội trưởng duy trì 11 chế độ trong ngày, 03 chế độ trong tuần; tập hợp, kiểm tra quân số trước và sau giờ học.',
            },
            { id: 'B', text: 'Phụ trách thu nộp tiền ăn và quản lý bếp ăn của đại đội.' },
            { id: 'C', text: 'Chỉ huy bảo dưỡng vũ khí và vật chất khí tài quân sự.' },
            { id: 'D', text: 'Toàn quyền quyết định mức kỷ luật đình chỉ học đối với sinh viên vi phạm.' },
          ],
          correctIds: ['A'],
          explanation:
            'Đại đội phó học tập chịu trách nhiệm cùng Đại đội trưởng duy trì 11 chế độ trong ngày, 3 chế độ trong tuần, kiểm tra tác phong, tập hợp quân số và điều hành sinh hoạt đại đội.',
        },
        {
          text: 'Khẩu lệnh chuẩn của Đại đội phó học tập khi giảng viên vào lớp và xuống lớp ra về là gì?',
          choices: [
            {
              id: 'A',
              text: '1. "Đứng dậy" "Nghiêm" - 2. "Chỉnh đốn trang phục nghỉ" - 3. "Chỉnh đốn trang phục xong" "Nghiêm" - 4. "Ngồi xuống"',
            },
            { id: 'B', text: '1. "Chào giảng viên" - 2. "Tất cả chú ý" - 3. "Nghỉ" - 4. "Ngồi xuống"' },
            { id: 'C', text: '1. "Cả lớp đứng" - 2. "Nghiêm" - 3. "Ngồi xuống"' },
            { id: 'D', text: '1. "Nghiêm" - 2. "Báo cáo giảng viên" - 3. "Mời giảng viên vào lớp"' },
          ],
          correctIds: ['A'],
          explanation:
            'Quy định nội vụ lớp học nêu rõ trình tự 4 bước khẩu lệnh chuẩn: 1. "Đứng dậy" "Nghiêm" - 2. "Chỉnh đốn trang phục nghỉ" - 3. "Chỉnh đốn trang phục xong" "Nghiêm" - 4. "Ngồi xuống".',
        },
      ],
    },
    {
      order: 2,
      title: 'Bài 2: Kế hoạch học tập, quy chế đào tạo & kiểm tra thi 4 học phần GDQP&AN',
      videoKey: '8.Nguyen Van Hoai.mp4',
      videoDurationSeconds: 298,
      passScore: 8,
      questions: [
        {
          text: 'Chương trình đào tạo GDQP&AN tập trung tại Trung tâm gồm bao nhiêu học phần và thời gian học bao lâu?',
          choices: [
            { id: 'A', text: 'Gồm 04 học phần học tập trung trong 04 tuần liên tục.' },
            { id: 'B', text: 'Gồm 02 học phần học trong 02 tháng.' },
            { id: 'C', text: 'Gồm 06 học phần kéo dài cả học kỳ.' },
            { id: 'D', text: 'Gồm 03 học phần lý thuyết và 01 học phần dã ngoại.' },
          ],
          correctIds: ['A'],
          explanation:
            'Theo chương trình chuẩn của Bộ GD&ĐT và Trung tâm: Sinh viên học 04 học phần tương ứng 04 tuần học tập, rèn luyện tập trung.',
        },
        {
          text: 'Sinh viên được dự thi kết thúc học phần GDQP&AN khi đáp ứng điều kiện nào sau đây?',
          choices: [
            {
              id: 'A',
              text: 'Tham gia học tập tối thiểu 80% thời lượng của học phần và có điểm kiểm tra thường xuyên đạt yêu cầu.',
            },
            { id: 'B', text: 'Chỉ cần có mặt trong ngày thi kết thúc môn.' },
            { id: 'C', text: 'Tham gia đủ 50% số buổi học trên giảng đường.' },
            { id: 'D', text: 'Được Đại đội phó học tập bảo lãnh không cần điểm danh.' },
          ],
          correctIds: ['A'],
          explanation:
            'Quy chế đào tạo quy định sinh viên phải tham gia tối thiểu 80% thời lượng học phần và hoàn thành các bài kiểm tra thường xuyên mới đủ điều kiện dự thi.',
        },
      ],
    },
    {
      order: 3,
      title: 'Bài 3: 11 chế độ trong ngày, 3 chế độ trong tuần & rèn luyện tác phong quân nhân',
      videoKey: '9.Phung Xuan Hoan.mp4',
      videoDurationSeconds: 272,
      passScore: 8,
      questions: [
        {
          text: 'Nội dung nào sau đây KHÔNG thuộc 11 chế độ trong ngày của Quân đội nhân dân Việt Nam thực hiện tại Trung tâm?',
          choices: [
            { id: 'A', text: 'Tự do rời khỏi doanh trại sau 18h00 không cần xin phép.' },
            { id: 'B', text: 'Treo quốc kỳ; thức dậy; thể dục sáng.' },
            { id: 'C', text: 'Kiểm tra sáng; học tập; ăn uống; bảo quản vũ khí khí tài.' },
            { id: 'D', text: 'Đọc báo, nghe tin; điểm quân số, ngủ nghỉ.' },
          ],
          correctIds: ['A'],
          explanation:
            '11 chế độ trong ngày quy định chặt chẽ từ thức dậy, thể dục sáng đến điểm danh, ngủ nghỉ. Tuyệt đối không có chế độ tự do rời khỏi doanh trại.',
        },
        {
          text: 'Ba chế độ trong tuần thực hiện tại Trung tâm bao gồm những nội dung nào?',
          choices: [
            { id: 'A', text: '1. Chào cờ, duyệt đội ngũ - 2. Thông báo chính trị - 3. Tổng vệ sinh doanh trại.' },
            { id: 'B', text: '1. Giao lưu văn nghệ - 2. Thi đấu bóng đá - 3. Dã ngoại.' },
            { id: 'C', text: '1. Kiểm tra quân tư trang - 2. Sinh hoạt câu lạc bộ - 3. Nghỉ ngơi tự do.' },
            { id: 'D', text: '1. Bắn đạn thật - 2. Hành quân đêm - 3. Đánh bóng chuyền.' },
          ],
          correctIds: ['A'],
          explanation:
            'Ba chế độ trong tuần gồm: 1. Chào cờ, duyệt đội ngũ đầu tuần; 2. Thông báo tình hình chính trị - thời sự; 3. Tổng vệ sinh doanh trại vào chiều thứ sáu/thứ bảy.',
        },
      ],
    },
    {
      order: 4,
      title: 'Bài 4: Chế độ ăn uống tập trung & vệ sinh an toàn thực phẩm',
      videoKey: '14.Le Thi Mai Linh.mp4',
      videoDurationSeconds: 198,
      passScore: 8,
      questions: [
        {
          text: 'Quy định về việc tổ chức ăn uống của sinh viên tại Trung tâm GDQP&AN là gì?',
          choices: [
            {
              id: 'A',
              text: 'Ăn tập trung tại nhà ăn theo đúng bàn, đúng giờ, bảo đảm văn minh trật tự và vệ sinh an toàn thực phẩm.',
            },
            { id: 'B', text: 'Sinh viên được tự do gọi đồ ăn nhanh từ bên ngoài vào ký túc xá.' },
            { id: 'C', text: 'Sinh viên tự nấu ăn trong phòng ở KTX để tiết kiệm chi phí.' },
            { id: 'D', text: 'Ăn uống tùy thích tại giảng đường trong giờ giải lao.' },
          ],
          correctIds: ['A'],
          explanation:
            'Quy định quản lý sinh viên yêu cầu ăn tập trung tại nhà ăn Trung tâm theo suất ăn đảm bảo định lượng dinh dưỡng, an toàn vệ sinh thực phẩm và nếp sống quân sự.',
        },
      ],
    },
    {
      order: 5,
      title: 'Bài 5: 8 hoạt động ngoại khóa bắt buộc, phong trào thi đua & khen thưởng kỷ luật',
      videoKey: '19.PHAM MANH THANG.mp4',
      videoDurationSeconds: 296,
      passScore: 8,
      questions: [
        {
          text: 'Theo đáp án chuẩn nghiệp vụ, 08 hoạt động ngoại khóa bắt buộc tại Trung tâm gồm các nội dung nào?',
          choices: [
            {
              id: 'A',
              text: 'Hành quân, gấp nội vụ, thể dục sáng, thông tin thời sự, sinh hoạt chuyên đề, tham quan di tích, PCCC, kỹ năng tự vệ.',
            },
            { id: 'B', text: 'Đi bơi, cắm trại, xem phim rạp, thi nhảy hiphop, đá bóng, leo núi, ca hát, làm báo tường.' },
            { id: 'C', text: 'Tham gia mạng xã hội, làm video tiktok, học tiếng Anh, bán hàng gây quỹ, du lịch, chụp ảnh nghệ thuật.' },
            { id: 'D', text: 'Bảo trì máy tính, học lái xe, sửa chữa điện tử, bồi dưỡng tin học, học nhảy khiêu vũ.' },
          ],
          correctIds: ['A'],
          explanation:
            'Tài liệu ĐÁP ÁN VIDEO quy định rõ 08 hoạt động bắt buộc: Hành quân rèn luyện, Hội thi gấp chăn màn nội vụ, Thể dục sáng, Thông tin thời sự, Sinh hoạt chuyên đề, Tham quan không gian VHHCM, Tập huấn PCCC và Kỹ năng tự vệ.',
        },
      ],
    },
    {
      order: 6,
      title: 'Bài 6: Quy định nội vụ phòng ở KTX & bàn giao cơ sở vật chất cuối khóa',
      videoKey: '20.Do Hong Thanh.mp4',
      videoDurationSeconds: 292,
      passScore: 8,
      questions: [
        {
          text: 'Quy định sắp xếp nội vụ trong phòng ở KTX tại Trung tâm yêu cầu những gì?',
          choices: [
            {
              id: 'A',
              text: 'Chăn màn gấp vuông vức đúng kích thước, đặt góc giường; giày dép, vali, sách vở để đúng vị trí quy định; phòng ở sạch sẽ thông thoáng.',
            },
            { id: 'B', text: 'Được để quần áo bừa bãi trên giường miễn sao phòng đóng kín cửa.' },
            { id: 'C', text: 'Được dán áp phích, vẽ tranh tùy ý lên tường phòng ở KTX.' },
            { id: 'D', text: 'Chỉ cần dọn dẹp phòng một lần vào ngày cuối cùng trước khi trả phòng.' },
          ],
          correctIds: ['A'],
          explanation:
            'Nội vụ phòng ở quân đội yêu cầu chăn màn vuông vức như viên gạch, trật tự thống nhất từ vị trí giày dép, balô, vali đến sách vở để rèn luyện tính kỷ luật, ngăn nắp.',
        },
      ],
    },
  ];

  for (const ld of lessonsData) {
    let lesson = await Lesson.findOne({ courseId: course._id, order: ld.order });
    if (!lesson) {
      lesson = await Lesson.create({
        courseId: course._id,
        title: ld.title,
        order: ld.order,
        videoKey: ld.videoKey,
        videoDurationSeconds: ld.videoDurationSeconds,
        passScore: ld.passScore,
        minCoveragePercent: 0.95,
        totalQuestionsPerQuiz: ld.questions.length,
        active: true,
      });
    } else {
      lesson.videoKey = ld.videoKey;
      lesson.videoDurationSeconds = ld.videoDurationSeconds;
      await lesson.save();
    }

    // Seed câu hỏi trắc nghiệm
    for (const q of ld.questions) {
      const existingQ = await Question.findOne({ lessonId: lesson._id, text: q.text });
      if (!existingQ) {
        await Question.create({
          lessonId: lesson._id,
          courseId: course._id,
          text: q.text,
          choices: q.choices,
          correctIds: q.correctIds,
          explanation: q.explanation,
          active: true,
        });
      }
    }
  }

  console.log('✅ Đã nạp thành công Khóa học GDQP-QLSV và 6 bài giảng video cho sinh viên!');
  await mongoose.disconnect();
}

if (process.argv[1]?.endsWith('seed_courses.ts') || process.argv[1]?.endsWith('seed_courses.js')) {
  runCourseSeed()
    .then(() => {
      console.log('🎉 Hoàn thành nạp dữ liệu khóa học sinh viên!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Lỗi seed khóa học:', err);
      process.exit(1);
    });
}
