import { UnauthorizedError } from '../../../utils/errors/index.js';
import { findPublicEmployeeById } from '../../../shared/employees/employee.queries.js';
import { toPublicEmployee } from '../../../shared/employees/employee.presenter.js';

export async function getProfileService(employeeId) {
  const row = await findPublicEmployeeById(employeeId);
  if (!row) throw new UnauthorizedError('Authentication required');
  return toPublicEmployee(row);
}
