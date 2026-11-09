import { Router } from 'express';
import { ROLES } from '../../../constants/roles.js';
import { authenticate } from '../../../middleware/authentication.js';
import { hasRole } from '../../../middleware/authorization.js';
import {
  createEmployeeValidation,
  listEmployeesValidation,
} from '../validations/employee.validation.js';
import {
  createEmployeeController,
  listEmployeesController,
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

export default router;
