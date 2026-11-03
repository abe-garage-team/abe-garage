// Add an escaped text/HTML template when implementing notifications.

function escapeHtml(value) {
  const replacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return String(value).replace(/[&<>"']/g, (character) => {
    return replacements[character];
  });
}

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
