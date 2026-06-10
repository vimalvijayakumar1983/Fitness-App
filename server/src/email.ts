/**
 * Minimal, dependency-optional email layer.
 *
 * If SMTP_* env vars are set AND the optional `nodemailer` package is installed,
 * real mail is sent. Otherwise emails are logged to the console so the app's
 * flows (welcome, password reset, receipts) are fully testable without
 * credentials — the same "works in dev, real in prod" pattern as Stripe/AI.
 */

const FROM = process.env.EMAIL_FROM || 'Al Zaabi Health <no-reply@alzaabi.health>';

// Resolve nodemailer at runtime only; never a hard dependency.
let transporter: any = null;
try {
  if (process.env.SMTP_HOST) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
} catch {
  transporter = null; // nodemailer not installed — fall back to logging
}

export const emailEnabled = !!transporter;

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(mail: Mail): Promise<void> {
  if (!transporter) {
    console.log(`📧 [email:dev] to=${mail.to} · subject="${mail.subject}"\n${mail.text}`);
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, ...mail });
  } catch (err) {
    console.error('Email send failed:', err);
  }
}

const wrap = (title: string, body: string) =>
  `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a211a">
     <h2 style="color:#1b8a46;margin:0 0 12px">🌿 Al Zaabi Health</h2>
     <h3 style="margin:0 0 12px">${title}</h3>
     <div style="font-size:15px;line-height:1.5">${body}</div>
     <p style="color:#949d90;font-size:12px;margin-top:24px">Al Zaabi Health · preventive, metabolic & longevity care</p>
   </div>`;

export function welcomeEmail(to: string, name?: string): Mail {
  const hi = name ? `Hi ${name},` : 'Welcome,';
  const text = `${hi}\n\nWelcome to Al Zaabi Health — your preventive, metabolic and longevity companion. Start by completing your health assessment to unlock your metabolic & longevity scores.`;
  return { to, subject: 'Welcome to Al Zaabi Health 🌿', text, html: wrap('Welcome aboard', `<p>${hi}</p><p>Welcome to <b>Al Zaabi Health</b> — your preventive, metabolic and longevity companion.</p><p>Start by completing your health assessment to unlock your metabolic &amp; longevity scores.</p>`) };
}

export function resetEmail(to: string, code: string): Mail {
  const text = `Your Al Zaabi Health password reset code is: ${code}\n\nIt expires in 30 minutes. If you didn't request this, you can ignore this email.`;
  return { to, subject: 'Your password reset code', text, html: wrap('Reset your password', `<p>Your password reset code is:</p><p style="font-size:28px;font-weight:800;letter-spacing:4px;color:#1b8a46">${code}</p><p>It expires in 30 minutes. If you didn't request this, ignore this email.</p>`) };
}

export function receiptEmail(to: string, plan: string, amountLabel: string): Mail {
  const text = `Thank you! Your Al Zaabi Health ${plan} subscription is active. Amount: ${amountLabel}.`;
  return { to, subject: 'Payment received — Al Zaabi Health', text, html: wrap('Payment received', `<p>Thank you! Your <b>${plan}</b> subscription is now active.</p><p>Amount: <b>${amountLabel}</b></p>`) };
}
