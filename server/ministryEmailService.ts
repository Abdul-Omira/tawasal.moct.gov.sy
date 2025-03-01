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
  async sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
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
        headers: {
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Reply-To': 'tawasal@moct.gov.sy'
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

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>رسالة جديدة من مواطن - وزارة الاتصالات</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 20px !important; }
            .header { padding: 25px !important; }
            .details-table { font-size: 13px !important; }
            .btn { padding: 12px 24px !important; font-size: 14px !important; }
            .mobile-stack { display: block !important; width: 100% !important; }
        }
        
        @media screen and (max-width: 480px) {
            .content { padding: 15px !important; }
            .header { padding: 20px !important; }
            h1 { font-size: 20px !important; }
            .details-row td { padding: 8px 0 !important; }
            .label { width: 100px !important; }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .dark-bg { background-color: #1a1a1a !important; }
            .dark-content { background-color: #2d2d2d !important; color: #ffffff !important; }
            .dark-text { color: #e0e0e0 !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; direction: rtl; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    
    <!-- Preheader text -->
    <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
        رسالة جديدة من مواطن: ${communication.subject} - ${communication.fullName}
    </div>
    
    <!-- Main container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <!-- Email content container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="background-color: #ffffff; border-radius: 20px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); overflow: hidden; max-width: 600px;">
                    
                    <!-- Header with Syrian emblem gradient -->
                    <tr>
                        <td class="header" style="background: linear-gradient(135deg, #1a365d 0%, #2d5282 50%, #3182ce 100%); padding: 40px 30px; text-align: center; position: relative;">
                            
                            <!-- Syrian flag pattern overlay -->
                            <div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #000000 33.33%, #ffffff 33.33%, #ffffff 66.66%, #dc2626 66.66%);"></div>
                            
                            <!-- Ministry logo placeholder -->
                            <div style="width: 80px; height: 80px; background: rgba(255, 255, 255, 0.15); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; border: 3px solid rgba(255, 255, 255, 0.3);">
                                <div style="width: 50px; height: 50px; background: linear-gradient(45deg, #fbbf24, #f59e0b); border-radius: 50%; position: relative;">
                                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 30px; height: 30px; border: 2px solid #ffffff; border-radius: 50%;"></div>
                                </div>
                            </div>
                            
                            <h1 style="color: #ffffff; font-size: 26px; font-weight: 700; margin: 0 0 8px 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); letter-spacing: -0.5px;">
                                🇸🇾 رسالة جديدة من مواطن
                            </h1>
                            <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 0; font-weight: 400;">
                                منصة التواصل المباشر مع معالي الوزير
                            </p>
                            <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #fbbf24, #f59e0b); margin: 20px auto 0; border-radius: 2px;"></div>
                        </td>
                    </tr>
                    
                    <!-- Priority alert banner -->
                    <tr>
                        <td style="padding: 0;">
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 18px 30px; border-bottom: 3px solid #f59e0b; position: relative; overflow: hidden;">
                                <div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%); border-radius: 50%; transform: translate(30px, -30px);"></div>
                                <div style="display: flex; align-items: center; position: relative;">
                                    <div style="background: #f59e0b; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-left: 12px; font-weight: bold; font-size: 14px;">!</div>
                                    <div>
                                        <p style="color: #92400e; font-size: 15px; font-weight: 600; margin: 0 0 2px 0;">
                                            تتطلب مراجعة فورية
                                        </p>
                                        <p style="color: #a16207; font-size: 13px; margin: 0; opacity: 0.9;">
                                            رسالة جديدة وصلت من المواطن ${communication.fullName}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main content -->
                    <tr>
                        <td class="content" style="padding: 35px;">
                            
                            <!-- Reference number highlight -->
                            <div style="text-align: center; margin-bottom: 30px;">
                                <div style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; padding: 12px 24px; border-radius: 25px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                                    رقم المرجع: #${communication.id}
                                </div>
                            </div>
                            
                            <!-- Communication details card -->
                            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 25px; margin-bottom: 25px; border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
                                
                                <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%); border-radius: 50%;"></div>
                                
                                <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 20px 0; font-weight: 600; position: relative;">
                                    📋 تفاصيل المواطن والرسالة
                                </h2>
                                
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="details-table">
                                    <tr class="details-row">
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                            <strong class="label" style="color: #64748b; font-size: 14px; display: inline-block; width: 140px; font-weight: 500;">👤 الاسم الكامل:</strong>
                                            <span style="color: #1e293b; font-size: 15px; font-weight: 600;">${communication.fullName}</span>
                                                </td>
                                            </tr>
                                    <tr class="details-row">
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                            <strong class="label" style="color: #64748b; font-size: 14px; display: inline-block; width: 140px; font-weight: 500;">📧 البريد الإلكتروني:</strong>
                                            <a href="mailto:${communication.email}" style="color: #3b82f6; font-size: 14px; text-decoration: none; font-weight: 500; padding: 4px 8px; background: rgba(59, 130, 246, 0.1); border-radius: 6px;">${communication.email}</a>
                                                </td>
                                            </tr>
                                    <tr class="details-row">
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                            <strong class="label" style="color: #64748b; font-size: 14px; display: inline-block; width: 140px; font-weight: 500;">📱 رقم الهاتف:</strong>
                                            <span style="color: #1e293b; font-size: 14px;">${communication.phone || '❌ غير متوفر'}</span>
                                                </td>
                                            </tr>
                                    <tr class="details-row">
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                            <strong class="label" style="color: #64748b; font-size: 14px; display: inline-block; width: 140px; font-weight: 500;">🏛️ المحافظة:</strong>
                                            <span style="color: #1e293b; font-size: 14px;">${communication.governorate || '❌ غير محدد'}</span>
                                                </td>
                                            </tr>
                                    <tr class="details-row">
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                            <strong class="label" style="color: #64748b; font-size: 14px; display: inline-block; width: 140px; font-weight: 500;">📂 نوع التواصل:</strong>
                                            <span style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); color: #1e40af; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block;">${communication.communicationType}</span>
                                                </td>
                                            </tr>
                                    <tr class="details-row">
                                        <td style="padding: 12px 0;">
                                            <strong class="label" style="color: #64748b; font-size: 14px; display: inline-block; width: 140px; font-weight: 500;">⏰ تاريخ الوصول:</strong>
                                            <span style="color: #1e293b; font-size: 14px; background: rgba(34, 197, 94, 0.1); padding: 4px 8px; border-radius: 6px; font-weight: 500;">${formatDate(communication.createdAt)}</span>
                                                </td>
                                            </tr>
                                        </table>
                            </div>
                            
                            <!-- Subject section -->
                            <div style="background: linear-gradient(135deg, #fef7cd 0%, #fef3c7 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px; border-right: 5px solid #f59e0b; position: relative;">
                                <div style="position: absolute; top: 15px; left: 15px; font-size: 24px; opacity: 0.3;">💡</div>
                                <h3 style="color: #92400e; font-size: 16px; margin: 0 0 10px 0; font-weight: 600; display: flex; align-items: center;">
                                    <span style="background: #f59e0b; color: #ffffff; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-left: 8px;">📋</span>
                                    موضوع الرسالة
                                </h3>
                                <p style="color: #1f2937; font-size: 16px; margin: 0; font-weight: 600; line-height: 1.5; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                                    ${communication.subject}
                                </p>
                            </div>
                            
                            <!-- Message content -->
                            <div style="margin-bottom: 30px;">
                                <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 15px 0; font-weight: 600; display: flex; align-items: center;">
                                    <span style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-left: 8px;">✉️</span>
                                    محتوى الرسالة
                                </h3>
                                <div style="background: #ffffff; border: 2px solid #f1f5f9; border-radius: 12px; padding: 25px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); position: relative; overflow: hidden;">
                                    <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: linear-gradient(180deg, #3b82f6 0%, #1e40af 100%);"></div>
                                    <p style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0; white-space: pre-wrap; text-align: justify; padding-right: 15px;">
                                        ${communication.message}
                                    </p>
                                </div>
                            </div>
                            
                            ${communication.attachmentUrl ? `
                            <!-- Attachment section -->
                            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 2px dashed #0369a1;">
                                <h3 style="color: #0c4a6e; font-size: 16px; margin: 0 0 10px 0; font-weight: 600; display: flex; align-items: center;">
                                    <span style="background: #0369a1; color: #ffffff; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-left: 8px;">📎</span>
                                    مرفق مع الرسالة
                                </h3>
                                <p style="color: #0c4a6e; font-size: 14px; margin: 0;">
                                    يحتوي هذا التواصل على مرفق يمكنكم الوصول إليه من خلال لوحة التحكم
                                </p>
                            </div>
                            ` : ''}
                            
                            <!-- Action buttons -->
                            <div style="text-align: center; margin-top: 35px;">
                                <div style="margin-bottom: 15px;">
                                    <a href="${process.env.APP_URL || 'https://tawasal.moct.gov.sy'}/mgt-system-2025"
                                       class="btn"
                                       style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3); transition: all 0.3s ease; text-align: center; min-width: 200px;">
                                        🖥️ عرض في لوحة التحكم
                                </a>
                                </div>
                                <p style="color: #64748b; font-size: 13px; margin: 0;">
                                    يمكنكم الرد على المواطن مباشرة من خلال لوحة التحكم
                                </p>
                            </div>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <div style="margin-bottom: 15px;">
                                <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #1e40af, #3b82f6); margin: 0 auto 15px; border-radius: 2px;"></div>
                                <p style="color: #475569; font-size: 14px; margin: 0 0 5px 0; font-weight: 500;">
                                    🤖 رسالة آلية من منصة التواصل المباشر
                            </p>
                                <p style="color: #64748b; font-size: 13px; margin: 0 0 15px 0;">
                                    🇸🇾 وزارة الاتصالات وتقانة المعلومات - الجمهورية العربية السورية
                            </p>
                                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                                    تم الإرسال في ${formatDate(new Date())} 🕐
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
    
</body>
</html>`;

    const text = `
🇸🇾 رسالة جديدة من مواطن - وزارة الاتصالات وتقانة المعلومات

رقم المرجع: #${communication.id}

تفاصيل المواطن:
================
👤 الاسم الكامل: ${communication.fullName}
📧 البريد الإلكتروني: ${communication.email}
📱 رقم الهاتف: ${communication.phone || 'غير متوفر'}
🏛️ المحافظة: ${communication.governorate || 'غير محدد'}
📂 نوع التواصل: ${communication.communicationType}
⏰ تاريخ الوصول: ${formatDate(communication.createdAt)}

موضوع الرسالة:
================
${communication.subject}

محتوى الرسالة:
================
${communication.message}

${communication.attachmentUrl ? `
📎 المرفقات: يحتوي هذا التواصل على مرفق يمكنكم الوصول إليه من خلال لوحة التحكم
` : ''}

🖥️ عرض في لوحة التحكم: ${process.env.APP_URL || 'https://tawasal.moct.gov.sy'}/mgt-system-2025

---
🤖 رسالة آلية من منصة التواصل المباشر
🇸🇾 وزارة الاتصالات وتقانة المعلومات - الجمهورية العربية السورية
`;

    return await this.sendEmail(
      process.env.MINISTER_EMAIL || 'minister@moct.gov.sy',
      `🇸🇾 رسالة جديدة من مواطن: ${communication.subject} | #${communication.id}`,
      html,
      text
    );
  }

  /**
   * Send confirmation email to citizen
   */
  async sendCitizenConfirmation(communication: CitizenCommunication): Promise<boolean> {
    console.log('📧 [MINISTRY-EMAIL] sendCitizenConfirmation called for:', communication.email);
    console.log('📧 [MINISTRY-EMAIL] Service initialized:', this.isInitialized);
    console.log('📧 [MINISTRY-EMAIL] Transporter exists:', !!this.transporter);
    // Load logo
    let logoHtml = '';
    try {
      const fs = await import('fs');
      const path = await import('path');
      const logoPath = path.join(__dirname, '../client/src/assets/headerlogo.png');
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      logoHtml = `<img src="data:image/png;base64,${logoBase64}" alt="وزارة الاتصالات" style="width: 180px; height: auto; display: block; margin: 0 auto;">`;
    } catch (e) {
      logoHtml = '';
    }

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>تأكيد استلام الرسالة</title>
</head>
<body style="font-family: Arial, sans-serif; direction: rtl; line-height: 1.8; margin: 0; padding: 40px; background: #ffffff;">
    <div style="max-width: 600px; margin: 0 auto; text-align: center;">
        ${logoHtml}
        
        <div style="margin-top: 40px; text-align: right;">
            <p style="font-size: 16px; color: #333; margin: 20px 0;">
                شكرًا لتواصلكم مع وزير الاتصالات وتقانة المعلومات السيد عبدالسلام هيكل.
            </p>
            
            <p style="font-size: 16px; color: #333; margin: 20px 0;">
                نراجع جميع الرسائل بعناية واهتمام ونحولها إلى الجهة المناسبة للمتابعة عند الحاجة.
            </p>
            
            <p style="font-size: 16px; color: #333; margin: 20px 0;">
                نُقدّر مشاركتكم وحرصكم على دعم وتطوير قطاع الاتصالات والتكنولوجيا في سورية، مع رجائنا تفهّمكم لعدم إمكانية الرد بشكل شخصي على جميع المراسلات الواردة.
            </p>
            
            <div style="margin-top: 40px;">
                <p style="font-size: 16px; color: #333; margin: 10px 0;">
                    مكتب وزير الاتصالات وتقانة المعلومات<br>
                    الجمهورية العربية السورية
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;

    const text = `
شكرًا لتواصلكم مع وزير الاتصالات وتقانة المعلومات السيد عبدالسلام هيكل.

نراجع جميع الرسائل بعناية واهتمام ونحولها إلى الجهة المناسبة للمتابعة عند الحاجة.

نُقدّر مشاركتكم وحرصكم على دعم وتطوير قطاع الاتصالات والتكنولوجيا في سورية، مع رجائنا تفهّمكم لعدم إمكانية الرد بشكل شخصي على جميع المراسلات الواردة.

مكتب وزير الاتصالات وتقانة المعلومات
الجمهورية العربية السورية
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
export const sendMinistryEmail = (to: string, subject: string, html: string, text: string) => 
  ministryEmailService.sendEmail(to, subject, html, text);
export const sendMinisterNotification = (communication: CitizenCommunication) => 
  ministryEmailService.sendMinisterNotification(communication);
export const sendCitizenConfirmation = (communication: CitizenCommunication) => 
  ministryEmailService.sendCitizenConfirmation(communication);

export default ministryEmailService;