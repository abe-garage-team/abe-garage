// Add an escaped text/HTML template when implementing notifications.
import { escapeHtml } from './escape-html.js';

export function buildCarReadyEmail({ customerName, trackingUrl }) {
  const safeName = escapeHtml(customerName);
  const safeUrl = escapeHtml(trackingUrl);

  return {
    subject: 'Your car is ready — Abe Garage',
    text: `Hello ${customerName},

Your repair is complete and your car is ready for collection.
View your order: ${trackingUrl}`,
    html: `<p>Hello ${safeName},</p>
<p>Your repair is complete and your car is ready for collection.</p>
<p><a href="${safeUrl}">View your order</a></p>`,
  };
}
