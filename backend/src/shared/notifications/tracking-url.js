export function buildTrackingUrl({ frontendUrl, orderHash }) {
  const baseUrl = new URL(frontendUrl);

  if (baseUrl.protocol !== 'https:') {
    throw new Error('Tracking links require an HTTPS frontend URL');
  }

  if (baseUrl.username || baseUrl.password) {
    throw new Error('Frontend URL must not contain credentials');
  }

  if (typeof orderHash !== 'string' || orderHash.trim() === '') {
    throw new Error('Order hash is required');
  }

  return new URL(`/order-status/${encodeURIComponent(orderHash)}`, baseUrl.origin).href;
}
