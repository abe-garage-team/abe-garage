import { escapeHtml } from './escape-html.js';

export function buildOrderCreatedEmail({ customerName, trackingUrl }) {
  const safeName = escapeHtml(customerName);
  const safeUrl = escapeHtml(trackingUrl);

  return {
    subject: 'Your Abe Garage order',
    text: `Hello ${customerName},

Your repair order has been created.
Track your order: ${trackingUrl}`,
    html: `<p>Hello ${safeName},</p>
<p>Your repair order has been created.</p>
<p><a href="${safeUrl}">Track your order</a></p>`,
  };
}
