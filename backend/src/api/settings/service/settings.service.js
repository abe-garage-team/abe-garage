import { pool } from '../../../config/db.js';
import { ServiceUnavailableError } from '../../../utils/errors/index.js';
import { toDecimalString } from '../../../utils/serialize.js';

// Roles are fixed reference data (1 Technician, 2 Manager, 3 Admin); there is no create/edit/delete.
export async function listRolesService() {
  const [rows] = await pool.execute('SELECT role_id, role_name FROM roles ORDER BY role_id');
  return rows;
}

// The garage has exactly one settings row (settings_id = 1), written by the install step.
async function readSettings(connection = pool) {
  const [rows] = await connection.execute(
    'SELECT settings_id, name, address, phone, email, vat_rate FROM garage_settings WHERE settings_id = 1',
  );
  if (!rows[0]) throw new ServiceUnavailableError('Installation has not completed');
  return { ...rows[0], vat_rate: toDecimalString(rows[0].vat_rate) };
}

export async function getSettingsService() {
  return readSettings();
}

const EDITABLE_SETTINGS = ['name', 'address', 'phone', 'email', 'vat_rate'];

// Changing vat_rate affects new orders only: each order stores the rate it was created with.
export async function updateSettingsService(input) {
  const fields = EDITABLE_SETTINGS.filter((field) => input[field] !== undefined);
  // Column names come from EDITABLE_SETTINGS, never from the client.
  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => input[field]);

  const [result] = await pool.execute(
    `UPDATE garage_settings SET ${setClause} WHERE settings_id = 1`,
    values,
  );
  if (result.affectedRows === 0) {
    throw new ServiceUnavailableError('Installation has not completed');
  }
  return readSettings();
}
