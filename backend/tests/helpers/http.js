import { once } from 'node:events';
import { app } from '../../index.js';

export async function startTestServer(t) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return 'http://127.0.0.1:' + server.address().port;
}

export function createClient(baseUrl, { origin = 'http://localhost:5173' } = {}) {
  let cookie = null;

  async function request(path, { method = 'GET', body, headers = {}, sendOrigin = true } = {}) {
    const requestHeaders = { Accept: 'application/json', ...headers };
    if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
    if (cookie) requestHeaders.Cookie = cookie;
    if (sendOrigin && method !== 'GET' && !requestHeaders.Origin) requestHeaders.Origin = origin;

    const response = await fetch(baseUrl + path, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const [pair, ...attributes] = setCookie.split(';');
      const value = pair.split('=').slice(1).join('=');
      const expiresAttribute = attributes.find((a) =>
        a.trim().toLowerCase().startsWith('expires='),
      );
      const expired = expiresAttribute && new Date(expiresAttribute.split('=')[1]) < new Date();
      cookie = value && !expired ? pair : null;
    }
    const json = await response.json().catch(() => null);
    return { status: response.status, body: json, headers: response.headers, setCookie };
  }

  return {
    request,
    get cookie() {
      return cookie;
    },
    set cookie(value) {
      cookie = value;
    },
  };
}
