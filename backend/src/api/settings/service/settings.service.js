import { pool } from '../../../config/db.js';

// Roles are fixed reference data (1 Technician, 2 Manager, 3 Admin); there is no create/edit/delete.
export async function listRolesService() {
  const [rows] = await pool.execute('SELECT role_id, role_name FROM roles ORDER BY role_id');
  return rows;
}
