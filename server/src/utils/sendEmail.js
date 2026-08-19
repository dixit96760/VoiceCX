const nodemailer = require('nodemailer');

let cachedTestAccount = null;

/**
 * Sends a real 6-digit OTP email to the specified email address
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit OTP code
 */
const sendOtpEmail = async (toEmail, otpCode) => {
  try {
    let transporter;

    // Option 1: Custom SMTP (SendGrid, Mailgun, AWS SES, Brevo, Gmail SMTP)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      // Option 2: Gmail Service Transport
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });
    } else {
      // Option 3: Auto-generated Ethereal SMTP test account for instant sandbox email testing
      if (!cachedTestAccount) {
        cachedTestAccount = await nodemailer.createTestAccount();
      }
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: cachedTestAccount.user,
          pass: cachedTestAccount.pass,
        },
      });
    }

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <div style="display: inline-block; width: 48px; height: 48px; background-color: #6366f1; border-radius: 12px; margin-bottom: 16px;">
            <span style="font-size: 24px; color: #ffffff; line-height: 48px; font-weight: bold;">V</span>
          </div>

          <h2 style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; tracking-tight: -0.5px;">VoiceCX Security Verification</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0; line-height: 1.5;">
            Use the 6-digit verification code below to complete sign in.
          </p>

          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #cbd5e1;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #4338ca; display: block;">
              ${otpCode}
            </span>
          </div>

          <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">
            This security code is valid for <strong>5 minutes</strong>.
          </p>
          <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
            VoiceCX • Restaurant Customer Intelligence Platform
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"VoiceCX Security" <no-reply@voicecx.com>',
      to: toEmail,
      subject: `${otpCode} is your VoiceCX Verification Code`,
      text: `Your VoiceCX verification code is: ${otpCode}. Valid for 5 minutes.`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Sent OTP email to ${toEmail}. MessageID: ${info.messageId}`);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email Service] Ethereal Email Inbox Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null,
    };
  } catch (error) {
    console.error('[Email Service Error]', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  sendOtpEmail,
};
