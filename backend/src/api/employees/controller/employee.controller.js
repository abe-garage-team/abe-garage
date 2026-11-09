import { asyncHandler } from '../../../utils/async-handler.js';
import { respond } from '../../../utils/respond.js';
import { requestDetails } from '../../../shared/auth/auth-events.js';
import {
  createEmployeeService,
  listEmployeesService,
  getEmployeeService,
} from '../service/employee.service.js';

export const createEmployeeController = asyncHandler(async (req, res) => {
  const employee = await createEmployeeService(req.body, req.user, requestDetails(req));
  return respond(res, employee, 'Create employee successful', 201);
});

export const listEmployeesController = asyncHandler(async (req, res) => {
  const result = await listEmployeesService(req.query, req.user);
  return respond(res, result, 'List and search employees successful');
});

export const getEmployeeController = asyncHandler(async (req, res) => {
  const employee = await getEmployeeService(req.params.employee_id);
  return respond(res, employee, 'View employee successful');
});
