import nodemailer from 'nodemailer';
import { ENV } from '../config/env.config.js';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: ENV.SMTP_PORT,
        secure: ENV.SMTP_PORT === 465,
        auth: {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASS,
        },
      });
    }
    return this.transporter;
  }

  async sendActivationEmail(email: string, name: string, token: string): Promise<boolean> {
    if (!ENV.SMTP_USER || !ENV.SMTP_PASS) {
      console.warn(`[DEV SIMULATION] Bỏ qua gửi mail thật. Link kích hoạt cho ${email} (${name}): ${ENV.CLIENT_URL}/activate?token=${token}`);
      return true;
    }

    try {
      const activationUrl = `${ENV.CLIENT_URL}/activate?token=${token}`;
      const mailOptions = {
        from: ENV.SMTP_FROM,
        to: email,
        subject: '[GDQP&AN] Thư Mời Kích Hoạt Tài Khoản Học Tập Trực Tuyến',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
            <h2 style="color: #1a365d; text-align: center;">TRUNG TÂM GIÁO DỤC QUỐC PHÒNG VÀ AN NINH</h2>
            <hr style="border: none; border-top: 2px solid #2b6cb0; margin: 20px 0;" />
            <p>Kính gửi sinh viên <strong>${name}</strong>,</p>
            <p>Hệ thống đã nhận được danh sách lớp học phần của bạn. Để tham gia học tập các bài giảng video và hoàn thành các bài khảo thí trắc nghiệm, vui lòng kích hoạt tài khoản của bạn bằng cách bấm vào nút bên dưới:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationUrl}" style="background-color: #2b6cb0; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Kích Hoạt Tài Khoản & Đặt Mật Khẩu</a>
            </div>
            <p style="font-size: 13px; color: #718096;">Liên kết này có hiệu lực trong vòng 72 giờ. Nếu nút trên không bấm được, bạn có thể sao chép liên kết sau dán vào trình duyệt:</p>
            <p style="font-size: 12px; color: #4a5568; word-break: break-all;">${activationUrl}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #a0aec0; text-align: center;">Đây là email tự động, vui lòng không trả lời thư này.</p>
          </div>
        `,
      };

      await this.getTransporter().sendMail(mailOptions);
      console.log(`Đã gửi email kích hoạt tới ${email}`);
      return true;
    } catch (error) {
      console.error(`Gửi email kích hoạt tới ${email} thất bại:`, error);
      return false;
    }
  }
}

export const emailService = new EmailService();
