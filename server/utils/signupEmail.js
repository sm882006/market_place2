import nodemailer from 'nodemailer';

export const isSignupEmailConfigured = () =>
  Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

export const sendEmailOtp = async (email, otp, purpose = 'signup') => {
  const isGmail = process.env.SMTP_HOST === 'smtp.gmail.com' || (process.env.SMTP_USER && process.env.SMTP_USER.endsWith('@gmail.com'));
  const port = Number(process.env.SMTP_PORT || 587);

  const transportOptions = isGmail && !process.env.SMTP_HOST
    ? {
        service: 'gmail',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      }
    : {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: port,
        secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      };

  const transporter = nodemailer.createTransport(transportOptions);

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"MarketPICT" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Your MarketPICT ${purpose} code`,
    text: `Your MarketPICT ${purpose} code is ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 16px;">MarketPICT Verification</h2>
        <p style="font-size: 15px; color: #334155;">Your verification code for <strong>${purpose}</strong> is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; margin: 24px 0; color: #1e293b; background: #f8fafc; padding: 12px; border-radius: 6px;">
          ${otp}
        </div>
        <p style="font-size: 13px; color: #64748b;">This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.</p>
      </div>
    `,
  });
};

