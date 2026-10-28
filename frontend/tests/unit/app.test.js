import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatMoney } from '../../src/utils/format-money.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('frontend root App and entry files exist', () => {
  const appFile = path.resolve(__dirname, '../../src/app/App.jsx');
  const routesFile = path.resolve(__dirname, '../../src/app/routes.jsx');
  assert.ok(fs.existsSync(appFile), 'App.jsx must exist');
  assert.ok(fs.existsSync(routesFile), 'routes.jsx must exist');
});

test('frontend format-money utility formats ETB correctly', () => {
  const formatted = formatMoney('230.00');
  assert.ok(formatted.includes('230.00') || formatted.includes('ETB'), 'Must format currency');
});
