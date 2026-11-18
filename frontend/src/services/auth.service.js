import { apiRequest } from './core/api-client.js';

// BE-004 login: the server sets the session cookie; the body carries the employee.
export async function login(email, password) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
    authenticated: false,
  });
  return response.data.employee;
}

// BE-004 logout: deletes this session on the server and clears the cookie.
export function logout() {
  return apiRequest('/auth/logout', { method: 'POST' });
}

// BE-008: who is logged in, straight from the database. 401 means nobody.
export async function getProfile(signal) {
  const response = await apiRequest('/profile', { signal });
  return response.data;
}

// BE-005: always answers 200, whether or not the email exists.
export function forgotPassword(email) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    authenticated: false,
  });
}

// BE-006: the token comes from the emailed link.
export function resetPassword(token, newPassword) {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: { token, new_password: newPassword },
    authenticated: false,
  });
}

// BE-007: on success the server ends every session; the caller must log in again.
export function changePassword(currentPassword, newPassword) {
  return apiRequest('/auth/password', {
    method: 'PATCH',
    body: { current_password: currentPassword, new_password: newPassword },
  });
}
