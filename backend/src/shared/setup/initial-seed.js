import { env } from '../../config/env.js';
import { hashPassword, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '../auth/passwords.js';

function requiredEnv(name) {
  const value = (process.env[name] || '').trim();
  if (!value) throw new Error('Set ' + name + ' in backend/.env');
  return value;
}

export function readInitialSeedFromEnv() {
  const password = process.env.INITIAL_ADMIN_PASSWORD || '';
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new Error(
      `INITIAL_ADMIN_PASSWORD must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`,
    );
  }
  const email = requiredEnv('INITIAL_ADMIN_EMAIL').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('INITIAL_ADMIN_EMAIL is invalid');
  return {
    admin: {
      email,
      password,
      firstName: requiredEnv('INITIAL_ADMIN_FIRST_NAME'),
      lastName: requiredEnv('INITIAL_ADMIN_LAST_NAME'),
      phone: requiredEnv('INITIAL_ADMIN_PHONE'),
    },
    garage: {
      name: requiredEnv('GARAGE_NAME'),
      address: requiredEnv('GARAGE_ADDRESS'),
      phone: requiredEnv('GARAGE_PHONE'),
      email: requiredEnv('GARAGE_EMAIL').toLowerCase(),
      currency: env.currency,
    },
  };
}

export async function seedInitialData(connection, seed) {
  const [roles] = await connection.execute(
    'SELECT role_id FROM roles WHERE role_id = 3 FOR UPDATE',
  );
  if (!roles.length) throw new Error('Roles are missing: import backend/db/schema.sql first');

  const [admins] = await connection.execute(
    'SELECT employee_id FROM employees WHERE role_id = 3 AND active = 1 LIMIT 1 FOR UPDATE',
  );
  let adminCreated = false;
  if (!admins.length) {
    const passwordHash = await hashPassword(seed.admin.password);
    await connection.execute(
      `INSERT INTO employees (email, first_name, last_name, phone, password_hash, role_id)
       VALUES (?, ?, ?, ?, ?, 3)`,
      [seed.admin.email, seed.admin.firstName, seed.admin.lastName, seed.admin.phone, passwordHash],
    );
    adminCreated = true;
  }

  const [settings] = await connection.execute(
    'SELECT settings_id FROM garage_settings WHERE settings_id = 1 FOR UPDATE',
  );
  let settingsCreated = false;
  if (!settings.length) {
    await connection.execute(
      `INSERT INTO garage_settings (settings_id, name, address, phone, email, currency)
       VALUES (1, ?, ?, ?, ?, ?)`,
      [
        seed.garage.name,
        seed.garage.address,
        seed.garage.phone,
        seed.garage.email,
        seed.garage.currency,
      ],
    );
    settingsCreated = true;
  }

  const [roleCount] = await connection.execute('SELECT COUNT(*) AS count FROM roles');
  return { adminCreated, settingsCreated, rolesCount: Number(roleCount[0].count) };
}
