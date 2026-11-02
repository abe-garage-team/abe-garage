import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// An isolated schema is created and dropped; never seed or mutate the developer's database.
dotenv.config({ path: new URL('../../.env', import.meta.url) });
const schema = 'be040_test_' + randomBytes(8).toString('hex');
process.env.DB_NAME = schema;
process.env.AUTH_TOKEN_PEPPER = randomBytes(32).toString('hex');
process.env.MAIL_ADAPTER = 'fake';
const { env } = await import('../../src/config/env.js');
const { database: _database, connectionLimit: _limit, ...serverConfig } = env.db;

test('BE-040 MySQL and HTTP acceptance', async (t) => {
  let serverDb;
  try {
    serverDb = await mysql.createConnection(serverConfig);
  } catch (error) {
    if (process.env.DATABASE_INTEGRATION === 'true') throw error;
    t.skip('MySQL unavailable; set DATABASE_INTEGRATION=true to require acceptance checks');
    return;
  }
  let db;
  let pool;
  let httpServer;
  t.after(async () => {
    if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
    if (pool) await pool.end();
    if (db) await db.end();
    // The generated identifier cannot contain SQL syntax or match the development database.
    assert.match(schema, /^be040_test_[a-f0-9]{16}$/);
    try {
      await serverDb.query('DROP DATABASE IF EXISTS `' + schema + '`');
    } finally {
      await serverDb.end();
    }
  });
  await serverDb.query(
    'CREATE DATABASE `' + schema + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',
  );
  db = await mysql.createConnection({ ...serverConfig, database: schema, dateStrings: true });
  const { applyBaselineSchema, ensureMigrationLedger, applyPendingMigrations } =
    await import('../../src/shared/setup/migrations.js');
  await applyBaselineSchema(db);
  await ensureMigrationLedger(db);
  await applyPendingMigrations(db);
  const dbModule = await import('../../src/config/db.js');
  pool = dbModule.pool;
  const { issueInvoiceService, createBillingService } =
    await import('../../src/api/billing/service/billing.service.js');
  const { createSessionForEmployee } = await import('../../src/shared/sessions/session.store.js');
  const { buildSignedCookieValue } = await import('../../src/shared/auth/tokens.js');
  const { app } = await import('../../index.js');

  const staff = {};
  for (const [name, role, active] of [
    ['admin', 3, 1],
    ['manager', 2, 1],
    ['technician', 1, 1],
    ['inactive', 2, 0],
  ]) {
    const [r] = await db.execute(
      'INSERT INTO employees (email, first_name, last_name, phone, password_hash, role_id, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name + '@example.com', name, 'Test', '0900000000', 'unused-test-hash', role, active],
    );
    const session = await createSessionForEmployee(r.insertId, {});
    staff[name] = {
      id: r.insertId,
      token: session.token,
      cookie: env.auth.cookieName + '=' + encodeURIComponent(buildSignedCookieValue(session.token)),
    };
  }
  await db.execute(
    'INSERT INTO garage_settings (settings_id, name, address, phone, email, vat_rate, currency) VALUES (1, ?, ?, ?, ?, ?, ?)',
    ['Test Garage', 'Addis', '0110000000', 'garage@example.com', '99.00', 'ETB'],
  );
  const [c] = await db.execute(
    'INSERT INTO customers (first_name,last_name,email,phone) VALUES (?,?,?,?)',
    ['Sara', 'Tesfaye', 'sara@example.com', '0912345678'],
  );
  const [v] = await db.execute(
    'INSERT INTO vehicles (customer_id,year,make,model,vehicle_type,mileage,plate,vin,color) VALUES (?,?,?,?,?,?,?,?,?)',
    [c.insertId, 2020, 'Toyota', 'Corolla', 'Sedan', 65000, 'TEST-040', null, 'White'],
  );
  const [s] = await db.execute('INSERT INTO services () VALUES ()');
  const [sv] = await db.execute(
    'INSERT INTO service_versions (service_id,version_number,name,description,default_price,labor_hours,created_by) VALUES (?,1,?,?,?,?,?)',
    [s.insertId, 'Oil change', 'Original service description', '0.10', '0.50', staff.admin.id],
  );
  async function order({ completed = true, line = true } = {}) {
    const [o] = await db.execute(
      'INSERT INTO orders (vehicle_id,created_by,status,order_hash,vat_rate,currency,estimated_ready_date) VALUES (?,?,1,?,?,?,DATE_ADD(UTC_TIMESTAMP(6), INTERVAL 1 DAY))',
      [v.insertId, staff.admin.id, randomBytes(32).toString('hex'), '5.00', 'ETB'],
    );
    if (line)
      await db.execute(
        'INSERT INTO order_lines (order_id,service_version_id,agreed_price) VALUES (?,?,?)',
        [o.insertId, sv.insertId, '0.10'],
      );
    if (completed) {
      await db.execute('UPDATE orders SET status = 2 WHERE order_id = ?', [o.insertId]);
      if (line) {
        await db.execute(
          'UPDATE order_lines SET technician_id=?,line_status=1,started_at=UTC_TIMESTAMP(6) WHERE order_id=?',
          [staff.technician.id, o.insertId],
        );
        await db.execute(
          'UPDATE order_lines SET line_status=2,done_at=UTC_TIMESTAMP(6) WHERE order_id=?',
          [o.insertId],
        );
      }
      await db.execute(
        'UPDATE orders SET status=4,completed_at=UTC_TIMESTAMP(6) WHERE order_id=?',
        [o.insertId],
      );
    }
    return o.insertId;
  }
  httpServer = app.listen(0, '127.0.0.1');
  await once(httpServer, 'listening');
  const base = 'http://127.0.0.1:' + httpServer.address().port;
  async function post(id, who = 'manager', body, origin = new URL(env.frontendUrl).origin) {
    const headers = { Origin: origin };
    if (who) headers.Cookie = staff[who].cookie;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const [pathId, queryString] = String(id).split('?');
    const requestUrl =
      base + '/api/orders/' + pathId + '/invoice' + (queryString ? '?' + queryString : '');
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  }
  const id = await order();
  let issued;
  await t.test(
    'missing, revoked, expired, inactive and technician sessions are rejected',
    async () => {
      assert.equal((await post(id, null)).status, 401);
      assert.equal((await post(id, 'inactive')).status, 403);
      assert.equal((await post(id, 'technician')).status, 403);
      const session = await createSessionForEmployee(staff.manager.id, {});
      staff.revoked = {
        cookie:
          env.auth.cookieName + '=' + encodeURIComponent(buildSignedCookieValue(session.token)),
      };
      await db.execute('DELETE FROM sessions WHERE employee_id=? AND token_hash=?', [
        staff.manager.id,
        (await import('../../src/shared/auth/tokens.js')).hashToken(session.token),
      ]);
      assert.equal((await post(id, 'revoked')).status, 401);
      const expired = await createSessionForEmployee(staff.manager.id, {});
      staff.expired = {
        cookie:
          env.auth.cookieName + '=' + encodeURIComponent(buildSignedCookieValue(expired.token)),
      };
      await db.execute(
        'UPDATE sessions SET created_at=DATE_SUB(UTC_TIMESTAMP(6),INTERVAL 2 DAY),expires_at=DATE_SUB(UTC_TIMESTAMP(6),INTERVAL 1 DAY) WHERE token_hash=?',
        [(await import('../../src/shared/auth/tokens.js')).hashToken(expired.token)],
      );
      assert.equal((await post(id, 'expired')).status, 401);
    },
  );
  await t.test('manager creates 201 with the agreed safe shape and stored tax', async () => {
    const result = await post(id);
    assert.equal(result.status, 201, JSON.stringify(result.body));
    issued = result.body.data;
    assert.equal(issued.invoice_number, 'INV-' + String(id).padStart(6, '0'));
    assert.deepEqual(
      [issued.subtotal, issued.vat_rate, issued.vat_amount, issued.total],
      ['0.10', '5.00', '0.01', '0.11'],
    );
    assert.equal(issued.garage.vat_rate, '5.00');
    assert.equal(issued.vehicle.vin, null);
    assert.equal(issued.paid, false);
    assert.deepEqual(
      Object.keys(issued).sort(),
      [
        'order_id',
        'document_type',
        'issued_at',
        'garage',
        'customer',
        'vehicle',
        'lines',
        'subtotal',
        'vat_rate',
        'vat_amount',
        'total',
        'currency',
        'status',
        'invoice_number',
        'paid',
        'paid_at',
        'paid_received_by',
      ].sort(),
    );
  });
  await t.test('admin repeat returns 200 and master edits do not alter the document', async () => {
    await db.execute('UPDATE customers SET first_name=? WHERE customer_id=?', [
      'Changed',
      c.insertId,
    ]);
    await db.execute('UPDATE vehicles SET plate=?,mileage=mileage+1 WHERE vehicle_id=?', [
      'CHANGED-040',
      v.insertId,
    ]);
    await db.execute('UPDATE garage_settings SET name=? WHERE settings_id=1', ['Changed']);
    const result = await post(id, 'admin');
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.data, issued);
    const [[audit]] = await db.execute(
      "SELECT COUNT(*) AS n FROM order_history WHERE order_id=? AND action='invoice_issued'",
      [id],
    );
    assert.equal(Number(audit.n), 1);
  });
  await t.test('invalid input and CSRF fail without inserting invoices', async () => {
    for (const invalid of ['0', '-1', '1.5', 'abc', '4294967296'])
      assert.equal((await post(invalid)).status, 400);
    for (const body of [{}, { invoice_number: 'fake' }, { paid: true }, []])
      assert.equal((await post(id, 'admin', body)).status, 400);
    assert.equal((await post(id + '?unknown=1')).status, 400);
    assert.equal((await post(id, 'admin', undefined, 'https://untrusted.example')).status, 403);
    assert.equal((await post(4294967295)).status, 404);
  });
  await t.test('unfinished, declined, empty and inconsistent work cannot be invoiced', async () => {
    for (const status of [1, 2, 3, 5]) {
      const pending = await order({ completed: false });
      if (status !== 1)
        await db.execute('UPDATE orders SET status=? WHERE order_id=?', [status, pending]);
      assert.equal((await post(pending)).status, 409);
    }
    const empty = await order({ line: false });
    assert.equal((await post(empty)).status, 409);
    const unfinished = await order({ completed: false });
    await db.execute('UPDATE orders SET status=4,completed_at=UTC_TIMESTAMP(6) WHERE order_id=?', [
      unfinished,
    ]);
    assert.equal((await post(unfinished)).status, 409);
  });
  await t.test('simultaneous issue requests create one document and one audit event', async () => {
    const concurrent = await order();
    const results = await Promise.all([post(concurrent), post(concurrent, 'admin')]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 201]);
    assert.deepEqual(results[0].body.data, results[1].body.data);
    const [[row]] = await db.execute('SELECT COUNT(*) AS n FROM invoices WHERE order_id=?', [
      concurrent,
    ]);
    assert.equal(Number(row.n), 1);
  });
  await t.test('financial and historical invoice facts remain immutable in MySQL', async () => {
    for (const [sql, params] of [
      ['UPDATE invoices SET garage_name=? WHERE order_id=?', ['tampered', id]],
      ['UPDATE order_lines SET agreed_price=? WHERE order_id=?', ['99.00', id]],
      ['DELETE FROM order_lines WHERE order_id=?', [id]],
      ['UPDATE orders SET vat_rate=? WHERE order_id=?', ['99.00', id]],
      ['UPDATE orders SET status=3,completed_at=NULL WHERE order_id=?', [id]],
      ['UPDATE service_versions SET name=? WHERE service_version_id=?', ['tampered', sv.insertId]],
      ['UPDATE vehicles SET customer_id=customer_id+1 WHERE vehicle_id=?', [v.insertId]],
    ])
      await assert.rejects(db.execute(sql, params), (error) => error.sqlState === '45000');
    assert.deepEqual((await post(id)).body.data, issued);
  });
  await t.test(
    'payment metadata is live without changing the issued identity or totals',
    async () => {
      const [[invoice]] = await db.execute('SELECT invoice_id FROM invoices WHERE order_id=?', [
        id,
      ]);
      await db.execute('INSERT INTO cash_payments (invoice_id,received_by) VALUES (?,?)', [
        invoice.invoice_id,
        staff.manager.id,
      ]);
      const result = await post(id);
      assert.equal(result.body.data.paid, true);
      assert.equal(result.body.data.paid_received_by, staff.manager.id);
      assert.deepEqual(
        { ...result.body.data, paid: false, paid_at: null, paid_received_by: null },
        issued,
      );
    },
  );
  await t.test('failed transaction rolls back invoice and history together', async () => {
    const rollbackOrder = await order();
    const service = createBillingService({
      transaction: (work) =>
        dbModule.withTransaction(async (connection) => {
          await work(connection);
          throw new Error('Forced rollback');
        }),
    });
    await assert.rejects(
      service.issueInvoiceService(rollbackOrder, staff.admin.id),
      /Forced rollback/,
    );
    const [[row]] = await db.execute('SELECT COUNT(*) AS n FROM invoices WHERE order_id=?', [
      rollbackOrder,
    ]);
    const [[audit]] = await db.execute('SELECT COUNT(*) AS n FROM order_history WHERE order_id=?', [
      rollbackOrder,
    ]);
    assert.equal(Number(row.n), 0);
    assert.equal(Number(audit.n), 0);
    assert.equal((await issueInvoiceService(rollbackOrder, staff.admin.id)).created, true);
  });
});
