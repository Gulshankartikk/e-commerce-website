import nodemailer from 'nodemailer';

/**
 * Send a transactional email. In development without SMTP credentials,
 * logs the message to the console instead of failing the request.
 */
export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`📧 [DEV EMAIL] to=${to} subject="${subject}"`);
    return { dev: true };
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter.sendMail({ from: process.env.EMAIL_FROM || 'LUXORA <no-reply@luxora.shop>', to, subject, html });
};

/** Shared branded wrapper for all transactional emails. */
export const emailTemplate = (title, bodyHtml, ctaText, ctaUrl) => `
  <div style="font-family:Inter,Arial,sans-serif;background:#0F172A;padding:32px">
    <div style="max-width:520px;margin:0 auto;background:#1E293B;border-radius:16px;padding:32px;color:#F8FAFC">
      <h1 style="margin:0 0 8px;font-size:22px;background:linear-gradient(90deg,#4F46E5,#06B6D4);-webkit-background-clip:text;color:#818CF8">LUXORA</h1>
      <h2 style="margin:0 0 16px;font-size:18px;color:#F8FAFC">${title}</h2>
      <div style="font-size:14px;line-height:1.7;color:#CBD5E1">${bodyHtml}</div>
      ${ctaText ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:24px;background:#4F46E5;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600">${ctaText}</a>` : ''}
      <p style="margin-top:28px;font-size:12px;color:#64748B">If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>`;
