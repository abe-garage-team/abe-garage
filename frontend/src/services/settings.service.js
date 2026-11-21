import { apiRequest } from './core/api-client.js';

// BE-014: the single garage settings row
export async function fetchSettings() {
  const response = await apiRequest('/settings');
  return response.data;
}

// BE-015: any subset of name, address, phone, email, vat_rate
export async function updateSettings(changes) {
  const response = await apiRequest('/settings', { method: 'PATCH', body: changes });
  return response.data;
}
