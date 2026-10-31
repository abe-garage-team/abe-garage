import { Router } from 'express';
import { authenticate } from '../../../middleware/authentication.js';
import { hasRole } from '../../../middleware/authorization.js';
import { validationHandler } from '../../../middleware/validation-handler.js';
import { ROLES } from '../../../constants/roles.js';
import { createCustomerValidation } from '../validations/customer.validation.js';
import { createCustomer } from '../controller/customer.controller.js';

const router = Router();

// BE-016: Register customer (Manager or Admin only)
router.post(
  '/',
  authenticate,
  hasRole(ROLES.MANAGER, ROLES.ADMIN),
  createCustomerValidation,
  validationHandler,
  createCustomer,
);

// Planned endpoints
// BE-017  GET   /
// BE-018  GET   /:customer_id
// BE-019  PATCH /:customer_id
// BE-021  GET   /:customer_id/vehicles

export default router;