import nodemailer from 'nodemailer';

export function createMailTransport() {
  if (!process.env.SMTP_HOST || !process.env.MAIL_FROM)
    throw new Error('Configure SMTP_HOST and MAIL_FROM before sending email');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}
