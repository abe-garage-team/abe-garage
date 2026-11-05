import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { app } from '../index.js';

async function listen(t) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return 'http://127.0.0.1:' + server.address().port;
}

test('every feature router is mounted below /api at its documented prefix', async (t) => {
  const manifest = JSON.parse(
    await readFile(new URL('../../scripts/scaffold-manifest.json', import.meta.url), 'utf8'),
  );
  const base = await listen(t);
  for (const mount of manifest.routing.mounts) {
    const { default: router } = await import(new URL('../src/api/' + mount.file, import.meta.url));
    const probe = '/__routing-test-' + mount.name + '/probe';
    router.get(probe, (req, res) => res.json({ feature: mount.name }));
    const probeLayer = router.stack.pop();
    router.stack.unshift(probeLayer);
    try {
      const prefix = mount.prefix === '/' ? '' : mount.prefix;
      const response = await fetch(base + '/api' + prefix + probe);
      assert.equal(response.status, 200, mount.name);
      assert.deepEqual(await response.json(), { feature: mount.name });
    } finally {
      router.stack.splice(router.stack.indexOf(probeLayer), 1);
    }
  }
});

test('unknown paths and duplicate /api prefixes return centralized 404 responses', async (t) => {
  const base = await listen(t);
  for (const url of ['/api/unknown-feature', '/api/api/unknown-feature']) {
    const response = await fetch(base + url);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      status: 'error',
      message: 'Route not found',
      data: null,
      code: 'NOT_FOUND',
    });
  }
});

test('malformed JSON is handled before feature routing', async (t) => {
  const base = await listen(t);
  const response = await fetch(base + '/api/unknown-feature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{broken',
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    status: 'error',
    message: 'Invalid JSON body',
    data: null,
    code: 'INVALID_JSON',
  });
});
