/**
 * Syrian Ministry of Communication - Official Email Service
 * Uses only Ministry SMTP server for all email communications
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

import nodemailer from 'nodemailer';
import type { CitizenCommunication } from '@shared/schema';

class MinistryEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isInitialized = false;
  private readonly logoUrl = 'https://tawasal.moct.gov.sy/assets/email-logo.png';

  /**
   * Initialize Ministry SMTP
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('📧 [MINISTRY-EMAIL] Initializing Ministry Email Service...');
      console.log('🏛️ [MINISTRY-EMAIL] Using official SMTP server: mail.moct.gov.sy');

      // Check for required environment variables
      if (!process.env.MINISTRY_SMTP_PASSWORD) {
        console.error('❌ [MINISTRY-EMAIL] Missing MINISTRY_SMTP_PASSWORD in environment');
        return false;
      }

      // Create Ministry SMTP transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.MINISTRY_SMTP_HOST || 'mail.moct.gov.sy',
        port: parseInt(process.env.MINISTRY_SMTP_PORT || '465'),
        secure: true, // SSL
        auth: {
          user: process.env.MINISTRY_SMTP_USER || 'tawasal@moct.gov.sy',
          pass: process.env.MINISTRY_SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false // Ministry server certificate issue - will be fixed in production with proper cert
        }
      });

      // Test the connection
      await this.transporter.verify();
      
      this.isInitialized = true;
      console.log('✅ [MINISTRY-EMAIL] Ministry Email Service initialized successfully');
      console.log('📬 [MINISTRY-EMAIL] Sender: tawasal@moct.gov.sy');
      
      return true;
    } catch (error) {
      console.error('❌ [MINISTRY-EMAIL] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Send email using Ministry SMTP
   */
  async sendEmail(to: string, subject: string, html: string, text: string, replyTo?: string): Promise<boolean> {
    if (!this.isInitialized || !this.transporter) {
      console.error('❌ [MINISTRY-EMAIL] Service not initialized');
      return false;
    }

    try {
      const result = await this.transporter.sendMail({
        from: '"وزارة الاتصالات وتقانة المعلومات" <tawasal@moct.gov.sy>',
        to,
        subject,
        html,
        text,
        replyTo: replyTo || 'tawasal@moct.gov.sy',
        headers: {
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
        }
      });

      console.log('✅ [MINISTRY-EMAIL] Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ [MINISTRY-EMAIL] Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send notification email to minister
   * Reply-To is set to the citizen's email so the minister can reply directly.
   */
  async sendMinisterNotification(communication: CitizenCommunication): Promise<boolean> {
    const formatDate = (date: Date | string) => {
      return new Date(date).toLocaleString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Damascus'
      });
    };

    const governorateText = communication.governorate || 'غير محدد';
    const phoneText = communication.phone || 'غير متوفر';
    const dashboardUrl = `${process.env.APP_URL || 'https://tawasal.moct.gov.sy'}/mgt-system-2025`;
    const logoUrl = this.logoUrl;


    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>رسالة جديدة - وزارة الاتصالات</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, 'Segoe UI', sans-serif; background-color: #eef1f5; direction: rtl;">

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #eef1f5;">
        <tr>
            <td align="center" style="padding: 32px 16px;">

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.07);">

                    <!-- Flag bar: green-white-black (Syrian independence flag) -->
                    <tr>
                        <td style="padding: 0; font-size: 0; line-height: 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td width="33.33%" style="height: 4px; background-color: #007A3D;"></td>
                                    <td width="33.33%" style="height: 4px; background-color: #ffffff;"></td>
                                    <td width="33.34%" style="height: 4px; background-color: #1a1a1a;"></td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Header with logo -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 32px 30px 28px 30px; text-align: center;">
                            <img src="${logoUrl}" alt="وزارة الاتصالات" width="52" height="52" style="display: block; margin: 0 auto 16px auto; width: 52px; height: 52px;" />
                            <h1 style="margin: 0 0 6px 0; font-size: 18px; color: #ffffff; font-weight: 700; letter-spacing: 0.3px;">رسالة جديدة من مواطن</h1>
                            <p style="margin: 0; font-size: 13px; color: #94a3b8;">منصة تواصل &nbsp;&middot;&nbsp; وزارة الاتصالات وتقانة المعلومات</p>
                        </td>
                    </tr>

                    <!-- Reference badge -->
                    <tr>
                        <td style="padding: 20px 32px 0 32px; text-align: center;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                                <tr>
                                    <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px 16px; border-radius: 20px;">
                                        <span style="font-size: 13px; color: #15803d; font-weight: 600;">المرجع #${communication.id}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Sender card -->
                    <tr>
                        <td style="padding: 20px 32px 0 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                                <tr>
                                    <td style="background-color: #f9fafb; padding: 14px 20px; border-bottom: 1px solid #e5e7eb;">
                                        <p style="margin: 0; font-size: 12px; font-weight: 600; color: #6b7280; letter-spacing: 0.4px;">المُرسل</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px 20px;">
                                        <p style="margin: 0 0 6px 0; font-size: 17px; font-weight: 700; color: #111827;">${communication.fullName}</p>
                                        <p style="margin: 0 0 4px 0; font-size: 14px; color: #374151;">
                                            <a href="mailto:${communication.email}" style="color: #2563eb; text-decoration: none;">${communication.email}</a>${communication.phone ? `<span style="color: #9ca3af;"> &nbsp;|&nbsp; </span>${phoneText}` : ''}
                                        </p>
                                        <p style="margin: 0; font-size: 13px; color: #9ca3af;">${governorateText} &nbsp;&middot;&nbsp; ${communication.communicationType} &nbsp;&middot;&nbsp; ${formatDate(communication.createdAt)}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Subject -->
                    <tr>
                        <td style="padding: 24px 32px 0 32px;">
                            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #6b7280; letter-spacing: 0.4px;">الموضوع</p>
                            <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111827; line-height: 1.5;">${communication.subject}</p>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 20px 32px 0 32px;">
                            <div style="height: 1px; background-color: #e5e7eb;"></div>
                        </td>
                    </tr>

                    <!-- Message body -->
                    <tr>
                        <td style="padding: 20px 32px 0 32px;">
                            <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 600; color: #6b7280; letter-spacing: 0.4px;">الرسالة</p>
                            <div style="padding: 20px; background-color: #fafafa; border-right: 3px solid #b9a779; border-radius: 6px; font-size: 15px; color: #1f2937; line-height: 1.9; white-space: pre-wrap;">${communication.message}</div>
                        </td>
                    </tr>

                    ${communication.attachmentUrl ? `
                    <!-- Attachment -->
                    <tr>
                        <td style="padding: 16px 32px 0 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;">
                                <tr>
                                    <td style="padding: 12px 16px;">
                                        <p style="margin: 0; font-size: 14px; color: #1d4ed8;">&#128206; يوجد مرفق &mdash; يمكن الاطلاع عليه من لوحة التحكم</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    ` : ''}

                    <!-- Actions -->
                    <tr>
                        <td style="padding: 28px 32px 12px 32px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                                <tr>
                                    <td style="background-color: #0f172a; padding: 13px 32px; border-radius: 6px;">
                                        <a href="${dashboardUrl}" style="color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; display: block; text-align: center;">عرض في لوحة التحكم</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 32px 28px 32px; text-align: center;">
                            <p style="margin: 0; font-size: 13px; color: #9ca3af;">يمكنك الرد مباشرة على هذا البريد للتواصل مع المواطن</p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                            <img src="${logoUrl}" alt="وزارة الاتصالات" width="24" height="24" style="display: block; margin: 0 auto 10px auto; width: 24px; height: 24px; opacity: 0.35;" />
                            <p style="margin: 0 0 4px 0; font-size: 12px; color: #9ca3af;">رسالة آلية &mdash; منصة التواصل المباشر</p>
                            <p style="margin: 0; font-size: 11px; color: #d1d5db;">وزارة الاتصالات وتقانة المعلومات &nbsp;&middot;&nbsp; الجمهورية العربية السورية</p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>`;

    const text = `رسالة جديدة من مواطن
المرجع: #${communication.id}

المرسل: ${communication.fullName}
البريد: ${communication.email}
الهاتف: ${phoneText}
المحافظة: ${governorateText}
النوع: ${communication.communicationType}
التاريخ: ${formatDate(communication.createdAt)}

الموضوع: ${communication.subject}

الرسالة:
${communication.message}
${communication.attachmentUrl ? '\nيوجد مرفق - يمكن الاطلاع عليه من لوحة التحكم\n' : ''}
لوحة التحكم: ${dashboardUrl}

---
رسالة آلية - منصة التواصل المباشر
وزارة الاتصالات وتقانة المعلومات - الجمهورية العربية السورية
`;

    return await this.sendEmail(
      process.env.MINISTER_EMAIL || 'minister@moct.gov.sy',
      `رسالة جديدة: ${communication.subject} | #${communication.id}`,
      html,
      text,
      `"${communication.fullName}" <${communication.email}>`
    );
  }

  /**
   * Send confirmation email to citizen
   */
  async sendCitizenConfirmation(communication: CitizenCommunication): Promise<boolean> {
    console.log('📧 [MINISTRY-EMAIL] sendCitizenConfirmation called for:', communication.email);
    console.log('📧 [MINISTRY-EMAIL] Service initialized:', this.isInitialized);
    console.log('📧 [MINISTRY-EMAIL] Transporter exists:', !!this.transporter);

    const logoUrl = this.logoUrl;

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تأكيد استلام الرسالة</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, 'Segoe UI', sans-serif; background-color: #eef1f5; direction: rtl;">

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #eef1f5;">
        <tr>
            <td align="center" style="padding: 32px 16px;">

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.07);">

                    <!-- Flag bar: green-white-black (Syrian independence flag) -->
                    <tr>
                        <td style="padding: 0; font-size: 0; line-height: 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td width="33.33%" style="height: 4px; background-color: #007A3D;"></td>
                                    <td width="33.33%" style="height: 4px; background-color: #ffffff;"></td>
                                    <td width="33.34%" style="height: 4px; background-color: #1a1a1a;"></td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Header with logo -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 32px 30px 28px 30px; text-align: center;">
                            <img src="${logoUrl}" alt="وزارة الاتصالات" width="52" height="52" style="display: block; margin: 0 auto 16px auto; width: 52px; height: 52px;" />
                            <h1 style="margin: 0 0 6px 0; font-size: 18px; color: #ffffff; font-weight: 700; letter-spacing: 0.3px;">تأكيد استلام رسالتكم</h1>
                            <p style="margin: 0; font-size: 13px; color: #94a3b8;">وزارة الاتصالات وتقانة المعلومات &nbsp;&middot;&nbsp; الجمهورية العربية السورية</p>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 32px 32px 0 32px;">
                            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827; line-height: 1.6;">${communication.fullName} &mdash; شكراً لتواصلكم</p>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 20px 32px 0 32px;">
                            <div style="height: 1px; background-color: #e5e7eb;"></div>
                        </td>
                    </tr>

                    <!-- Body text -->
                    <tr>
                        <td style="padding: 20px 32px 0 32px;">
                            <p style="margin: 0 0 18px 0; font-size: 15px; color: #374151; line-height: 1.9;">
                                شكراً لتواصلكم مع وزير الاتصالات وتقانة المعلومات السيد عبدالسلام هيكل.
                            </p>
                            <p style="margin: 0 0 18px 0; font-size: 15px; color: #374151; line-height: 1.9;">
                                نراجع جميع الرسائل بعناية واهتمام ونحوّلها إلى الجهة المناسبة للمتابعة عند الحاجة.
                            </p>
                            <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.9;">
                                نُقدّر مشاركتكم وحرصكم على دعم وتطوير قطاع الاتصالات والتكنولوجيا في سورية، مع رجائنا تفهّمكم لعدم إمكانية الرد بشكل شخصي على جميع المراسلات الواردة.
                            </p>
                        </td>
                    </tr>

                    <!-- Signature -->
                    <tr>
                        <td style="padding: 28px 32px 32px 32px;">
                            <div style="border-right: 3px solid #b9a779; padding-right: 16px;">
                                <p style="margin: 0 0 2px 0; font-size: 14px; font-weight: 600; color: #111827;">مكتب وزير الاتصالات وتقانة المعلومات</p>
                                <p style="margin: 0; font-size: 13px; color: #6b7280;">الجمهورية العربية السورية</p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                            <img src="${logoUrl}" alt="وزارة الاتصالات" width="24" height="24" style="display: block; margin: 0 auto 10px auto; width: 24px; height: 24px; opacity: 0.35;" />
                            <p style="margin: 0 0 4px 0; font-size: 12px; color: #9ca3af;">رسالة آلية &mdash; منصة التواصل المباشر</p>
                            <p style="margin: 0; font-size: 11px; color: #d1d5db;">وزارة الاتصالات وتقانة المعلومات &nbsp;&middot;&nbsp; الجمهورية العربية السورية</p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>`;

    const text = `شكراً لتواصلكم - ${communication.fullName}

شكراً لتواصلكم مع وزير الاتصالات وتقانة المعلومات السيد عبدالسلام هيكل.

نراجع جميع الرسائل بعناية واهتمام ونحوّلها إلى الجهة المناسبة للمتابعة عند الحاجة.

نُقدّر مشاركتكم وحرصكم على دعم وتطوير قطاع الاتصالات والتكنولوجيا في سورية، مع رجائنا تفهّمكم لعدم إمكانية الرد بشكل شخصي على جميع المراسلات الواردة.

مكتب وزير الاتصالات وتقانة المعلومات
الجمهورية العربية السورية

---
رسالة آلية - منصة التواصل المباشر
وزارة الاتصالات وتقانة المعلومات - الجمهورية العربية السورية
`;

    return await this.sendEmail(
      communication.email,
      'تأكيد استلام الرسالة - وزارة الاتصالات وتقانة المعلومات',
      html,
      text
    );
  }
}

// Create singleton instance
const ministryEmailService = new MinistryEmailService();

// Export functions
export const initializeMinistryEmail = () => ministryEmailService.initialize();
export const sendMinistryEmail = (to: string, subject: string, html: string, text: string, replyTo?: string) => 
  ministryEmailService.sendEmail(to, subject, html, text, replyTo);
export const sendMinisterNotification = (communication: CitizenCommunication) => 
  ministryEmailService.sendMinisterNotification(communication);
export const sendCitizenConfirmation = (communication: CitizenCommunication) => 
  ministryEmailService.sendCitizenConfirmation(communication);

export default ministryEmailService;