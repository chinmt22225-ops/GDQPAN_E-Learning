# -*- coding: utf-8 -*-
"""
Script tạo tài liệu Word (.docx) giới thiệu tổng thể Hệ thống E-Learning GDQP&AN
Dành cho đối tượng khách hàng không rành về IT (Lãnh đạo, Giảng viên, Chuyên viên đào tạo)
"""

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    """Đặt màu nền cho ô bảng"""
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tc_pr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    """Đặt lề trong ô bảng (đơn vị: dxa, 20 dxa = 1 pt)"""
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tc_pr.append(tc_mar)

def set_cell_borders(cell, top="CBD5E0", bottom="CBD5E0", left="CBD5E0", right="CBD5E0", sz="4"):
    """Đặt viền mỏng trang nhã cho ô"""
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{top}"/>
            <w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{left}"/>
            <w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{bottom}"/>
            <w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{right}"/>
        </w:tcBorders>
    ''')
    tc_pr.append(borders)

def add_callout(doc, text, title="ĐIỂM NỔI BẬT", bg_hex="EBF8FF", border_hex="2B6CB0"):
    """Tạo khung ghi chú nổi bật (Callout Box) trang nhã"""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, bg_hex)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=160)
    
    # Border trái dày, các cạnh khác trong suốt
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_hex}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tc_pr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    run_t = p.add_run(f"📌 {title}: ")
    run_t.font.name = "Arial"
    run_t.font.size = Pt(10.5)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(0x2B, 0x6C, 0xB0)
    
    run_b = p.add_run(text)
    run_b.font.name = "Arial"
    run_b.font.size = Pt(10)
    run_b.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
    
    # Khoảng cách sau bảng
    doc.add_paragraph().paragraph_format.space_after = Pt(2)

def main():
    doc = docx.Document()
    
    # Thiết lập lề trang tiêu chuẩn (1 inch ~ 2.54 cm)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
        # Header / Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("Hệ Thống Đào Tạo Trực Tuyến GDQP&AN | Tài Liệu Giới Thiệu Tổng Thể")
        hrun.font.name = "Arial"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(0xA0, 0xAE, 0xC0)
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Trang 1 / Tài liệu lưu hành nội bộ")
        frun.font.name = "Arial"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(0xA0, 0xAE, 0xC0)

    # -------------------------------------------------------------
    # 1. TIÊU ĐỀ CHÍNH & THÔNG TIN BÌA
    # -------------------------------------------------------------
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(6)
    
    r_subtop = p_title.add_run("TRUNG TÂM GIÁO DỤC QUỐC PHÒNG VÀ AN NINH\n")
    r_subtop.font.name = "Arial"
    r_subtop.font.size = Pt(12)
    r_subtop.font.bold = True
    r_subtop.font.color.rgb = RGBColor(0x71, 0x80, 0x96)
    
    r_title = p_title.add_run("BẢN GIỚI THIỆU TỔNG QUAN\nHỆ THỐNG HỌC TẬP & KHẢO THÍ TRỰC TUYẾN (E-LEARNING)")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(20)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D) # Navy đậm

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(18)
    r_sub = p_sub.add_run("Giải pháp đào tạo số hóa hiện đại – Tự động hóa chấm điểm – Chống tua lướt – Quản lý kết quả thời gian thực\n(Dành cho Lãnh đạo, Giảng viên và Ban Quản lý Đào tạo)")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(11)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(0x4A, 0x55, 0x68)

    # Đường phân cách
    p_div = doc.add_paragraph()
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_div.paragraph_format.space_after = Pt(14)
    r_div = p_div.add_run("════════════════════════════════════════════════════════════")
    r_div.font.color.rgb = RGBColor(0x2B, 0x6C, 0xB0)

    # -------------------------------------------------------------
    # 2. LỜI MỞ ĐẦU & TẦM NHÌN
    # -------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    r_h1 = h1.add_run("1. LỜI MỞ ĐẦU & TẦM NHÌN DỰ ÁN")
    r_h1.font.name = "Arial"
    r_h1.font.size = Pt(14)
    r_h1.font.bold = True
    r_h1.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)

    p_intro = doc.add_paragraph()
    p_intro.paragraph_format.line_spacing = 1.2
    p_intro.paragraph_format.space_after = Pt(8)
    p_intro.add_run(
        "Môn học Giáo dục Quốc phòng và An ninh (GDQP&AN) có tính chất đặc thù với lượng kiến thức lý thuyết quân sự, chính trị "
        "và pháp luật phong phú, đồng thời số lượng sinh viên theo học mỗi đợt rất đông (từ hàng trăm đến 5.000 sinh viên). "
        "Việc tổ chức giảng dạy lý thuyết tập trung trên giảng đường truyền thống thường gặp khó khăn về cơ sở vật chất, "
        "tốn nhiều thời gian điểm danh và công sức chấm hàng nghìn bài thi trên giấy."
    )

    p_intro2 = doc.add_paragraph()
    p_intro2.paragraph_format.line_spacing = 1.2
    p_intro2.paragraph_format.space_after = Pt(12)
    p_intro2.add_run(
        "Hệ thống E-Learning GDQP&AN ra đời nhằm mang lại một giải pháp đột phá: "
        "Chuyển đổi số hoàn toàn phần học lý thuyết, giúp sinh viên chủ động học tập mọi lúc mọi nơi trên điện thoại hoặc máy tính, "
        "đồng thời hỗ trợ Trung tâm giám sát chặt chẽ ý thức học tập, tự động chấm điểm bài thi 100% và xuất báo cáo kết quả chỉ bằng một cú nhấp chuột."
    )

    add_callout(
        doc,
        "Hệ thống được thiết kế theo nguyên tắc 'Đơn giản cho người học – Dễ dùng cho Thầy Cô – Chính xác cho Ban Giám đốc'. "
        "Quý Thầy Cô và Cán bộ quản lý không cần am hiểu công nghệ thông tin vẫn có thể sử dụng thành thạo ngay trong 15 phút hướng dẫn.",
        title="THÔNG ĐIỆP CHỦ ĐẠO"
    )

    # -------------------------------------------------------------
    # 3. LỢI ÍCH THỰC TẾ
    # -------------------------------------------------------------
    h2 = doc.add_heading(level=1)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    r_h2 = h2.add_run("2. NHỮNG LỢI ÍCH VƯỢT TRỘI HỆ THỐNG MANG LẠI")
    r_h2.font.name = "Arial"
    r_h2.font.size = Pt(14)
    r_h2.font.bold = True
    r_h2.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)

    # Bảng 3 cột: Đối tượng - Thách thức cũ - Giải pháp mới
    tbl_ben = doc.add_table(rows=1, cols=3)
    tbl_ben.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Đối tượng", "Khó khăn trước đây (Cách làm cũ)", "Giải pháp vượt trội của Hệ thống mới"]
    for i, title in enumerate(headers):
        cell = tbl_ben.cell(0, i)
        set_cell_background(cell, "1A365D")
        set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(title)
        r.font.name = "Arial"
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    data_ben = [
        ("Ban Lãnh đạo &\nPhòng Đào tạo",
         "• Giảng đường quá tải khi đón hàng nghìn sinh viên.\n• Khó kiểm soát tỉ lệ chuyên cần thực tế.\n• Thống kê kết quả thi mất nhiều ngày.",
         "• Giảm tải 100% áp lực phòng học lý thuyết.\n• Theo dõi số liệu sinh viên Đạt/Chưa đạt trực tiếp thời gian thực.\n• Xuất bảng điểm chuẩn Excel lưu trữ hồ sơ ngay tức thì."),
        ("Quý Thầy Cô\nGiảng viên",
         "• Mất nhiều công sức điểm danh lớp đông.\n• Chấm hàng nghìn bài thi trắc nghiệm trên giấy rất vất vả, dễ nhầm lẫn.\n• Khó giải đáp thắc mắc cho từng em.",
         "• Hệ thống tự động điểm danh dựa trên thời lượng xem video thật.\n• Chấm điểm tự động 100% ngay khi sinh viên nộp bài.\n• Tự động hiện đáp án và giải thích câu sai cho sinh viên hiểu bài."),
        ("Sinh viên\n(Học viên)",
         "• Phải có mặt cố định tại giảng đường.\n• Nghe giảng một lần khó nhớ hết kiến thức.\n• Thi xong phải chờ đợi nhiều ngày mới biết điểm.",
         "• Tự do học trên điện thoại hoặc máy tính mọi lúc mọi nơi.\n• Video bài giảng ngắn gọn (≤15 phút/bài), dễ theo dõi.\n• Biết điểm ngay sau khi nộp, được thi lại thoải mái để nâng cao kiến thức.")
    ]

    for row_idx, row_data in enumerate(data_ben):
        row = tbl_ben.add_row()
        bg = "F7FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row_data):
            c = row.cells[col_idx]
            set_cell_background(c, bg)
            set_cell_margins(c, top=120, bottom=120, left=120, right=120)
            set_cell_borders(c)
            p = c.paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(2)
            if col_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                r = p.add_run(text)
                r.font.name = "Arial"
                r.font.bold = True
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)
            else:
                r = p.add_run(text)
                r.font.name = "Arial"
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------
    # 4. QUY TRÌNH HỌC TẬP 4 BƯỚC
    # -------------------------------------------------------------
    h3 = doc.add_heading(level=1)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    r_h3 = h3.add_run("3. QUY TRÌNH HOẠT ĐỘNG: ĐƠN GIẢN QUA 4 BƯỚC")
    r_h3.font.name = "Arial"
    r_h3.font.size = Pt(14)
    r_h3.font.bold = True
    r_h3.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)

    p_step_intro = doc.add_paragraph()
    p_step_intro.paragraph_format.line_spacing = 1.2
    p_step_intro.paragraph_format.space_after = Pt(8)
    p_step_intro.add_run(
        "Toàn bộ chu trình học tập và đánh giá được thiết kế khép kín, logic và mạch lạc theo 4 bước trực quan sau:"
    )

    steps = [
        ("BƯỚC 1: NHẬP HỌC & CẤP TÀI KHOẢN TỰ ĐỘNG",
         "Nhà trường chỉ cần nạp danh sách lớp từ file Excel có sẵn (gồm Mã sinh viên, Họ tên, Lớp, Email). "
         "Hệ thống sẽ tự động gửi thư mời kèm đường dẫn bảo mật tới Gmail của từng sinh viên để các em tự đặt mật khẩu và kích hoạt tài khoản."),
        ("BƯỚC 2: HỌC BÀI GIẢNG VIDEO THÔNG MINH (≤ 15 PHÚT)",
         "Sinh viên đăng nhập và bắt đầu bài học. Trình xem video được thiết kế riêng: Khóa chức năng tua nhanh vượt bài, "
         "đảm bảo sinh viên phải chăm chú theo dõi bài học. Hệ thống tự động ghi nhận thời gian xem thực tế từng giây."),
        ("BƯỚC 3: MỞ KHÓA THI TRẮC NGHIỆM TỪNG BÀI",
         "Ngay khi sinh viên xem đủ từ 95% thời lượng video bài giảng, nút 'Làm bài kiểm tra' sẽ sáng lên. "
         "Mỗi bài kiểm tra gồm 10 câu hỏi bốc ngẫu nhiên từ ngân hàng đề, giúp chống học vẹt và chống chép bài lẫn nhau."),
        ("BƯỚC 4: BIẾT ĐIỂM NGAY – HIỂN THỊ GIẢI THÍCH – TỔNG KẾT KHÓA HỌC",
         "Sinh viên bấm nộp bài sẽ biết điểm ngay lập tức. Đạt từ 8/10 trở lên là hoàn thành bài học. "
         "Đặc biệt: Hệ thống tự động hiển thị đáp án đúng kèm lời giải thích chi tiết cho các câu làm sai để sinh viên ôn bài. "
         "Sinh viên có thể thi lại thoải mái để nâng cao điểm số. Khi hoàn thành tất cả các bài học, môn học sẽ được ghi nhận là ĐẠT.")
    ]

    for title, desc in steps:
        p_st = doc.add_paragraph()
        p_st.paragraph_format.space_before = Pt(4)
        p_st.paragraph_format.space_after = Pt(2)
        r_num = p_st.add_run(f"👉 {title}\n")
        r_num.font.name = "Arial"
        r_num.font.bold = True
        r_num.font.size = Pt(11)
        r_num.font.color.rgb = RGBColor(0x2B, 0x6C, 0xB0)
        
        r_desc = p_st.add_run(desc)
        r_desc.font.name = "Arial"
        r_desc.font.size = Pt(10)
        r_desc.font.color.rgb = RGBColor(0x4A, 0x55, 0x68)

    # -------------------------------------------------------------
    # 5. CÁC TÍNH NĂNG CHI TIẾT
    # -------------------------------------------------------------
    h4 = doc.add_heading(level=1)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)
    r_h4 = h4.add_run("4. CÁC TÍNH NĂNG NỔI BẬT DÀNH CHO CẢ 2 PHÍA")
    r_h4.font.name = "Arial"
    r_h4.font.size = Pt(14)
    r_h4.font.bold = True
    r_h4.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)

    # 4.1. Phía Sinh viên
    h41 = doc.add_heading(level=2)
    h41.paragraph_format.space_before = Pt(8)
    h41.paragraph_format.space_after = Pt(4)
    r_h41 = h41.add_run("4.1. Giao Diện & Trải Nghiệm Sinh Viên (Học Viên)")
    r_h41.font.name = "Arial"
    r_h41.font.size = Pt(12)
    r_h41.font.bold = True
    r_h41.font.color.rgb = RGBColor(0x2B, 0x6C, 0xB0)

    p_sv = doc.add_paragraph()
    p_sv.paragraph_format.line_spacing = 1.2
    p_sv.add_run("• ").bold = True
    p_sv.add_run("Bố cục bài giảng phong cách Khan Academy: ").bold = True
    p_sv.add_run("Khung bài học nằm ngay ngắn ở trung tâm, bài giảng chạy mượt mà, không có quảng cáo, không có yếu tố gây xao nhãng.\n")
    p_sv.add_run("• ").bold = True
    p_sv.add_run("Học mượt mà trên Điện thoại & Máy tính: ").bold = True
    p_sv.add_run("Giao diện tự động co giãn đẹp mắt trên mọi kích cỡ màn hình, sinh viên học qua trình duyệt điện thoại (Safari, Chrome, Zalo) đều rất tiện lợi.\n")
    p_sv.add_run("• ").bold = True
    p_sv.add_run("Xem video chống tua thông minh: ").bold = True
    p_sv.add_run("Video đã được nén tối ưu (chỉ tốn rất ít dung lượng mạng 4G). Thanh thời gian chỉ cho phép xem lại đoạn đã học, không cho phép kéo vượt thời gian chưa học.\n")
    p_sv.add_run("• ").bold = True
    p_sv.add_run("Chấm điểm tức thì & Xem giải thích: ").bold = True
    p_sv.add_run("Làm bài trắc nghiệm xong nhận ngay kết quả. Câu nào làm sai sẽ được hiển thị đáp án đúng kèm lời giải thích ngắn gọn, xúc tích để khắc sâu bài học.\n")
    p_sv.add_run("• ").bold = True
    p_sv.add_run("Thi lại không giới hạn: ").bold = True
    p_sv.add_run("Nếu chưa đạt điểm 8, sinh viên có thể bấm làm lại ngay lập tức mà không cần chờ đợi. Hệ thống luôn lưu lại điểm số cao nhất của sinh viên.")

    # 4.2. Phía Quản trị
    h42 = doc.add_heading(level=2)
    h42.paragraph_format.space_before = Pt(10)
    h42.paragraph_format.space_after = Pt(4)
    r_h42 = h42.add_run("4.2. Bảng Quản Trị Dành Cho Ban Lãnh Đạo & Giảng Viên (Admin)")
    r_h42.font.name = "Arial"
    r_h42.font.size = Pt(12)
    r_h42.font.bold = True
    r_h42.font.color.rgb = RGBColor(0x2B, 0x6C, 0xB0)

    p_adm = doc.add_paragraph()
    p_adm.paragraph_format.line_spacing = 1.2
    p_adm.add_run("• ").bold = True
    p_adm.add_run("Màn hình theo dõi trực tiếp (Live Dashboard): ").bold = True
    p_adm.add_run("Cập nhật thời gian thực khi sinh viên nộp bài. Thầy Cô ngồi tại văn phòng có thể nhìn thấy danh sách sinh viên hoàn thành nhấp nháy dấu tick xanh (✅ Đạt) hoặc dấu X đỏ (❌ Chưa đạt) mà không cần bấm F5 tải lại trang.\n")
    p_adm.add_run("• ").bold = True
    p_adm.add_run("Quản lý sinh viên thông minh: ").bold = True
    p_adm.add_run("Tìm kiếm sinh viên cực nhanh theo Tên hoặc Mã số sinh viên (gõ tên không dấu hệ thống vẫn tự hiểu). Lọc theo từng Lớp hoặc theo Trạng thái (Đạt / Chưa đạt / Chưa học).\n")
    p_adm.add_run("• ").bold = True
    p_adm.add_run("Thao tác ngân hàng câu hỏi dễ như dùng Word: ").bold = True
    p_adm.add_run("Thầy Cô có thể tự thêm mới, chỉnh sửa nội dung câu hỏi, bổ sung lời giải thích trực tiếp trên trang web, hoặc nạp hàng loạt 200 câu hỏi từ file Excel có sẵn.\n")
    p_adm.add_run("• ").bold = True
    p_adm.add_run("Xuất báo cáo Excel chuẩn mực: ").bold = True
    p_adm.add_run("Chỉ với 1 thao tác nhấn chuột, hệ thống sẽ trích xuất toàn bộ bảng điểm, số lần làm bài, ngày giờ hoàn thành ra file Excel được căn chỉnh sẵn để in ấn nộp Phòng Đào tạo.")

    # -------------------------------------------------------------
    # 6. GIẢI ĐÁP CÁC BẬN TÂM PHỔ BIẾN
    # -------------------------------------------------------------
    h5 = doc.add_heading(level=1)
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(6)
    r_h5 = h5.add_run("5. GIẢI ĐÁP CÁC BẬN TÂM PHỔ BIẾN CỦA NHÀ TRƯỜNG")
    r_h5.font.name = "Arial"
    r_h5.font.size = Pt(14)
    r_h5.font.bold = True
    r_h5.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)

    faq_list = [
        ("1. Có sợ sinh viên nhờ người khác học hộ hoặc thi hộ không?",
         "Hệ thống kiểm soát chặt chẽ phiên đăng nhập: Mỗi sinh viên chỉ được đăng nhập trên một thiết bị tại một thời điểm. "
         "Khi mở bài kiểm tra, đề thi được bốc ngẫu nhiên 10 câu và xáo trộn hoàn toàn thứ tự các đáp án A-B-C-D, "
         "ngăn chặn tình trạng hai sinh viên ngồi cạnh nhau đọc đáp án cho nhau chép."),
        ("2. Có sợ sinh viên tua lướt video cho xong để lấy điều kiện thi không?",
         "Không thể tua lướt. Trình phát video đã bị khóa thanh tua. Đồng thời, máy chủ tự đếm thời gian xem thực tế theo từng mốc 5 giây. "
         "Chỉ khi sinh viên xem thực chất tối thiểu 95% thời lượng bài giảng thì bài kiểm tra mới được phép mở ra."),
        ("3. Khi 2.000 – 5.000 sinh viên vào học cùng lúc, trang web có bị sập hoặc giật lag không?",
         "Hệ thống đã được thiết kế kiến trúc phân tán hiện đại: Toàn bộ video nặng được truyền tải qua hạ tầng mạng đám mây chuyên dụng "
         "(mạng lưới máy chủ siêu tốc của Cloudflare), không gây tải lên máy chủ trung tâm. "
         "Vì vậy, dù hàng nghìn sinh viên cùng xem video một lúc, hệ thống vẫn hoạt động nhẹ nhàng và mượt mà."),
        ("4. Dữ liệu điểm số và bài thi của sinh viên có bị mất nếu xảy ra sự cố không?",
         "Toàn bộ kết quả thi, lịch sử làm bài và tiến độ học tập được lưu trữ an toàn trong cơ sở dữ liệu và được tự động sao lưu "
         "định kỳ vào lúc 02:00 sáng mỗi ngày lên kho lưu trữ đám mây độc lập. Đảm bảo an toàn dữ liệu 100%."),
        ("5. Chi phí duy trì hệ thống có đắt đỏ không?",
         "Hệ thống được tối ưu hóa thông minh để tận dụng tối đa các chính sách miễn phí (Free Tier): Miễn phí 100% băng thông xem video, "
         "miễn phí gửi email qua Gmail. Khoản chi phí duy nhất là thuê 1 máy chủ VPS với giá chỉ khoảng vài trăm nghìn đồng mỗi tháng.")
    ]

    for q, a in faq_list:
        p_faq = doc.add_paragraph()
        p_faq.paragraph_format.space_before = Pt(6)
        p_faq.paragraph_format.space_after = Pt(4)
        p_faq.paragraph_format.line_spacing = 1.15
        
        r_q = p_faq.add_run(f"❓ {q}\n")
        r_q.font.name = "Arial"
        r_q.font.bold = True
        r_q.font.size = Pt(10.5)
        r_q.font.color.rgb = RGBColor(0x2B, 0x6C, 0xB0)
        
        r_a = p_faq.add_run(f"✔️ Trả lời: {a}")
        r_a.font.name = "Arial"
        r_a.font.size = Pt(10)
        r_a.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)

    # -------------------------------------------------------------
    # 7. LỘ TRÌNH TRIỂN KHAI & HỖ TRỢ
    # -------------------------------------------------------------
    h6 = doc.add_heading(level=1)
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(6)
    r_h6 = h6.add_run("6. KẾ HOẠCH TRIỂN KHAI & CHUYỂN GIAO")
    r_h6.font.name = "Arial"
    r_h6.font.size = Pt(14)
    r_h6.font.bold = True
    r_h6.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)

    p_plan = doc.add_paragraph()
    p_plan.paragraph_format.line_spacing = 1.2
    p_plan.add_run(
        "Để đảm bảo hệ thống vận hành trơn tru và an toàn tuyệt đối, dự án sẽ được triển khai theo các mốc rõ ràng:\n"
        "1. "
    )
    p_plan.add_run("Giai đoạn 1 (Xây dựng & Nạp học liệu): ").bold = True
    p_plan.add_run("Hoàn thiện hệ thống, nạp các video bài giảng và bộ câu hỏi trắc nghiệm của Trung tâm.\n2. ")
    p_plan.add_run("Giai đoạn 2 (Chạy thử nghiệm Pilot): ").bold = True
    p_plan.add_run("Áp dụng thử nghiệm cho 1–2 lớp học (khoảng 50–100 sinh viên) để lắng nghe phản hồi của Thầy Cô và sinh viên, tinh chỉnh cho hoàn hảo nhất.\n3. ")
    p_plan.add_run("Giai đoạn 3 (Áp dụng chính thức & Hướng dẫn sử dụng): ").bold = True
    p_plan.add_run("Bàn giao tài liệu hướng dẫn sử dụng chi tiết bằng hình ảnh cho Giảng viên, sẵn sàng đón 5.000 sinh viên vào học chính thức.")

    add_callout(
        doc,
        "Đội ngũ kỹ thuật cam kết luôn đồng hành, túc trực hỗ trợ kỹ thuật trong suốt quá trình triển khai và các đợt thi cao điểm của Trung tâm.",
        title="CAM KẾT ĐỒNG HÀNH",
        bg_hex="F0FFF4",
        border_hex="38A169"
    )

    # -------------------------------------------------------------
    # 8. KÝ TÊN / LỜI KẾT
    # -------------------------------------------------------------
    p_end = doc.add_paragraph()
    p_end.paragraph_format.space_before = Pt(16)
    p_end.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_end = p_end.add_run("Ban Dự Án Phát Triển Hệ Thống E-Learning GDQP&AN\nKính trình Ban Giám đốc và Quý Thầy Cô tham khảo!")
    r_end.font.name = "Arial"
    r_end.font.italic = True
    r_end.font.size = Pt(10.5)
    r_end.font.color.rgb = RGBColor(0x4A, 0x55, 0x68)

    # Lưu tài liệu
    output_path = "D:\\GDQPAN\\elearning-trungtam\\GIOI_THIEU_HE_THONG_ELEARNING_GDQPAN.docx"
    doc.save(output_path)
    print(f"Document created successfully at: {output_path}")

if __name__ == "__main__":
    main()
