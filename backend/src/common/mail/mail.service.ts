import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private readonly appUrl: string;
  private readonly from = 'noreply@marketplace.app';

  constructor(private config: ConfigService) {
    this.appUrl = config.get<string>('APP_URL', 'http://localhost:3000');
    const apiKey = config.get<string>('RESEND_API_KEY', '');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY not set — emails will be logged to console only');
    }
  }

  async sendPasswordReset(email: string, token: string) {
    const link = `${this.appUrl}/reset-password?token=${token}`;

    if (!this.resend) {
      this.logger.log(`[DEV] Password reset link for ${email}: ${link}`);
      return;
    }

    await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'รีเซ็ตรหัสผ่าน — Marketplace',
      html: this.resetPasswordHtml(link),
    });
  }

  private resetPasswordHtml(link: string) {
    return `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:32px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
    <h2 style="color:#1a7a6e;margin-top:0">รีเซ็ตรหัสผ่าน</h2>
    <p>เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ คลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่</p>
    <a href="${link}"
       style="display:inline-block;background:#1a7a6e;color:#fff;text-decoration:none;
              padding:12px 24px;border-radius:8px;font-weight:600;margin:16px 0">
      รีเซ็ตรหัสผ่าน
    </a>
    <p style="color:#6b7280;font-size:14px">ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้</p>
  </div>
</body>
</html>`;
  }
}
