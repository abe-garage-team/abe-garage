import { AppError } from '../../utils/errors/AppError.js';
import { env } from '../../config/env.js';
import { createMailTransport } from './transport.js';
import { createFakeMailTransport } from './fake-transport.js';
import { buildPasswordResetEmail } from './templates/password-reset.js';
import { logWarning } from '../../utils/log.js';
import { pool } from '../../config/db.js';
import { buildOrderCreatedEmail } from './templates/order-created.js';
import { buildCarReadyEmail } from './templates/car-ready.js';
import { buildTrackingUrl } from './tracking-url.js';
import { recordEmailDelivery } from './delivery-history.js';

let transport = null;
function getTransport() {
  if (!transport) {
    transport = env.mailAdapter === 'smtp' ? createMailTransport() : createFakeMailTransport();
  }
  return transport;
}

export async function sendPasswordResetEmail({ to, firstName, resetUrl, expiresInMinutes }) {
  try {
    const url = new URL(resetUrl);
    const frontend = new URL(env.frontendUrl);
    if (
      url.protocol !== 'https:' ||
      url.origin !== frontend.origin ||
      url.username ||
      url.password
    ) {
      throw new Error('Password reset links require the configured HTTPS frontend origin');
    }
    const email = buildPasswordResetEmail({ firstName, resetUrl, expiresInMinutes });
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

// Build order notification functions with real or fake dependencies.

export function createOrderNotificationService({ getTransport, db, frontendUrl, from, warn }) {
  async function sendOrderEmail({
    to,
    customerName,
    orderHash,
    orderId,
    employeeId = null,
    buildEmail,
  }) {
    let sent = false;

    try {
      const trackingUrl = buildTrackingUrl({ frontendUrl, orderHash });
      const email = buildEmail({ customerName, trackingUrl });

      const result = await getTransport().sendMail({
        from,
        to,
        ...email,
      });

      sent = Array.isArray(result.accepted) && result.accepted.length > 0;
      if (!sent) warn({ event: 'order_email_delivery_failed', order_id: orderId });
    } catch {
      warn({ event: 'order_email_delivery_failed', order_id: orderId });
    }

    try {
      await recordEmailDelivery({
        db,
        orderId,
        employeeId,
        sent,
      });
    } catch {
      warn({ event: 'order_email_history_failed', order_id: orderId });
    }

    return sent;
  }

  return {
    sendOrderCreatedEmail(input) {
      return sendOrderEmail({
        ...input,
        buildEmail: buildOrderCreatedEmail,
      });
    },

    sendCarReadyEmail(input) {
      return sendOrderEmail({
        ...input,
        buildEmail: buildCarReadyEmail,
      });
    },

    async resendOrderEmail({ status, ...input }) {
      const sent = await sendOrderEmail({
        ...input,
        buildEmail: Number(status) === 4 ? buildCarReadyEmail : buildOrderCreatedEmail,
      });
      if (!sent) {
        throw new AppError(
          'Email could not be sent',
          503,
          {
            order_id: input.orderId,
            email_status: 'failed',
          },
          'EMAIL_DELIVERY_FAILED',
        );
      }
      return true;
    },
  };
}

const orderNotifications = createOrderNotificationService({
  getTransport,
  db: pool,
  frontendUrl: env.frontendUrl,
  from: process.env.MAIL_FROM || 'no-reply@abegarage.local',
  warn: logWarning,
});

export const sendOrderCreatedEmail = orderNotifications.sendOrderCreatedEmail;
export const sendCarReadyEmail = orderNotifications.sendCarReadyEmail;
export const resendOrderEmail = orderNotifications.resendOrderEmail;
