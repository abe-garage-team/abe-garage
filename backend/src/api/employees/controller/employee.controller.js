import { asyncHandler } from '../../../utils/async-handler.js';
import { respond } from '../../../utils/respond.js';
import { requestDetails } from '../../../shared/auth/auth-events.js';
import { createEmployeeService } from '../service/employee.service.js';

export const createEmployeeController = asyncHandler(async (req, res) => {
  const employee = await createEmployeeService(req.body, req.user, requestDetails(req));
  return respond(res, employee, 'Create employee successful', 201);
});
