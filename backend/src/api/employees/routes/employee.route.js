import { Router } from 'express';
import { ROLES } from '../../../constants/roles.js';
import { authenticate } from '../../../middleware/authentication.js';
import { hasRole } from '../../../middleware/authorization.js';
import {
  createEmployeeValidation,
  listEmployeesValidation,
  getEmployeeValidation,
  updateEmployeeValidation,
} from '../validations/employee.validation.js';
import {
  createEmployeeController,
  listEmployeesController,
  getEmployeeController,
  updateEmployeeController,
} from '../controller/employee.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', hasRole(ROLES.ADMIN), createEmployeeValidation, createEmployeeController);
router.get(
  '/',
  hasRole(ROLES.ADMIN, ROLES.MANAGER),
  listEmployeesValidation,
  listEmployeesController,
);
router.get('/:employee_id', hasRole(ROLES.ADMIN), getEmployeeValidation, getEmployeeController);
router.patch(
  '/:employee_id',
  hasRole(ROLES.ADMIN),
  updateEmployeeValidation,
  updateEmployeeController,
);

export default router;
