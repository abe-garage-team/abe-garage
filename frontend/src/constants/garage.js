// Contact details for the public header and footer. They come from the frontend .env
// until the API offers a public settings endpoint; the Admin-only GET /settings is not
// readable by visitors.
const env = import.meta.env;
export const GARAGE = Object.freeze({
  name: env.VITE_GARAGE_NAME || 'Abe Garage',
  phone: env.VITE_GARAGE_PHONE || '',
  email: env.VITE_GARAGE_EMAIL || '',
  address: env.VITE_GARAGE_ADDRESS || '',
  hours: env.VITE_GARAGE_HOURS || '',
});
export const telHref = (phone) => `tel:${(phone || '').replace(/[^+\d]/g, '')}`;
