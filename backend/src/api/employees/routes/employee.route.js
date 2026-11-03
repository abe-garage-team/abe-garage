import { Router } from 'express';
import { ROLES } from '../../../constants/roles.js';
import { authenticate } from '../../../middleware/authentication.js';
import { hasRole } from '../../../middleware/authorization.js';
import { createEmployeeValidation } from '../validations/employee.validation.js';
import { createEmployeeController } from '../controller/employee.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', hasRole(ROLES.ADMIN), createEmployeeValidation, createEmployeeController);

export default router;
