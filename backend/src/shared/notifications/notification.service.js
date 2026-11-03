import { env } from '../../config/env.js';
import { createMailTransport } from './transport.js';
import { createFakeMailTransport } from './fake-transport.js';
import { buildPasswordResetEmail } from './templates/password-reset.js';
import { logWarning } from '../../utils/log.js';

let transport = null;
function getTransport() {
  if (!transport) {
    transport = env.mailAdapter === 'smtp' ? createMailTransport() : createFakeMailTransport();
  }
  return transport;
}

export async function sendPasswordResetEmail({ to, firstName, resetUrl, expiresInMinutes }) {
  const email = buildPasswordResetEmail({ firstName, resetUrl, expiresInMinutes });
  try {
    await getTransport().sendMail({
      from: process.env.MAIL_FROM || 'no-reply@abegarage.local',
      to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    return true;
  } catch (error) {
    logWarning({ event: 'password_reset_email_failed', error_name: error.name, code: error.code });
    return false;
  }
}
