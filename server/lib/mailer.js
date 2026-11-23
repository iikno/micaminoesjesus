import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transport;

// Plain text only. With MAIL_DISABLED=1 nothing leaves the process: the message is printed instead.
export async function sendMail({ to, subject, text, replyTo }) {
  if (config.MAIL_DISABLED) {
    console.log(`[mail disabled] to=${to} subject=${subject}${replyTo ? ` reply-to=${replyTo}` : ''}\n${text}\n`);
    return;
  }
  transport ??= nodemailer.createTransport({
    host: config.SMTP_HOST, port: config.SMTP_PORT, secure: config.SMTP_SECURE,
    auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
  });
  await transport.sendMail({ from: config.SMTP_FROM, to, subject, text, replyTo });
}

// Notifications must never break the request that triggered them.
// Resolves true when sent, false when it failed.
export const trySend = (m) => sendMail(m).then(() => true, (e) => { console.error('mail failed:', e.message); return false; });
