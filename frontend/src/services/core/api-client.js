/* global URLSearchParams */
// The one place the frontend talks to the API. Pages never call fetch() directly.
//
// Authentication is a session cookie set by POST /auth/login. The browser stores it and
// sends it back on every request because of `credentials: 'include'`; nothing is kept in
// localStorage. On a 401 for an authenticated call, the app is told the session is gone.
const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(
  /[/]$/,
  '',
);

// Error thrown for every non-2xx answer. `status` is the HTTP status, `code` the API's
// error code, `data` the payload's data (validation errors live in data.errors), and
// `field` the first invalid field name, so a form can mark the right input.
export class ApiError extends Error {
  constructor(status, payload) {
    const errors = payload?.data?.errors;
    const field = errors ? Object.keys(errors)[0] : undefined;
    super((field && errors[field]) || payload?.message || 'Request failed');
    this.status = status;
    this.code = payload?.code ?? null;
    this.data = payload?.data ?? null;
    this.field = field;
  }
}

function withQuery(path, query) {
  if (!query) return path;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}

export async function apiRequest(
  path,
  { method = 'GET', body, query, authenticated = true, signal } = {},
) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(baseUrl + withQuery(path, query), {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, { message: 'Cannot reach the server. Check your connection.' });
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && authenticated) {
      window.dispatchEvent(new Event('abe-garage:session-expired'));
    }
    throw new ApiError(response.status, payload);
  }
  return payload;
}
