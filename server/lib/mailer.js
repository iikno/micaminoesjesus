import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transport;

// Plain text only. With MAIL_DISABLED=1 nothing leaves the process: the message is printed instead.
export async function sendMail({ to, subject, text }) {
  if (config.MAIL_DISABLED) {
    console.log(`[mail disabled] to=${to} subject=${subject}\n${text}\n`);
    return;
  }
  transport ??= nodemailer.createTransport({
    host: config.SMTP_HOST, port: config.SMTP_PORT, secure: config.SMTP_SECURE,
    auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
  });
  await transport.sendMail({ from: config.SMTP_FROM, to, subject, text });
}

// Notifications must never break the request that triggered them.
export const trySend = (m) => sendMail(m).catch((e) => console.error('mail failed:', e.message));
