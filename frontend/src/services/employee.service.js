import { apiRequest } from './core/api-client.js';

// BE-010: Admin gets every employee; a Manager gets active technicians only.
export async function fetchEmployees({ search, role_id, active, page = 1, limit = 10 } = {}) {
  const response = await apiRequest('/employees', {
    query: { search, role_id, active, page, limit },
  });
  return response.data; // { employees, pagination }
}

// BE-011
export async function fetchEmployee(employeeId) {
  const response = await apiRequest(`/employees/${employeeId}`);
  return response.data;
}

// BE-009: first_name, last_name, email, phone, password, role_id, active
export async function createEmployee(data) {
  const response = await apiRequest('/employees', { method: 'POST', body: data });
  return response.data;
}

// BE-012: any subset of first_name, last_name, email, phone, role_id, active
export async function updateEmployee(employeeId, changes) {
  const response = await apiRequest(`/employees/${employeeId}`, {
    method: 'PATCH',
    body: changes,
  });
  return response.data;
}

// BE-013: the three fixed roles, for dropdowns
export async function fetchRoles() {
  const response = await apiRequest('/roles');
  return response.data.roles;
}
