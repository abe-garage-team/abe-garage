function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildPasswordResetEmail({ firstName, resetUrl, expiresInMinutes }) {
  const subject = 'Reset your Abe Garage password';
  const text = [
    `Hello ${firstName},`,
    '',
    'Someone asked to reset the password for your Abe Garage staff account.',
    `Open this link within ${expiresInMinutes} minutes to choose a new password:`,
    resetUrl,
    '',
    'If you did not ask for this, you can ignore this email. Your password will not change.',
  ].join('\n');
  const html = `
    <p>Hello ${escapeHtml(firstName)},</p>
    <p>Someone asked to reset the password for your Abe Garage staff account.</p>
    <p>Open this link within ${escapeHtml(expiresInMinutes)} minutes to choose a new password:</p>
    <p><a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a></p>
    <p>If you did not ask for this, you can ignore this email. Your password will not change.</p>
  `;
  return { subject, text, html };
}
