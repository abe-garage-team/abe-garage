import { Router } from 'express';
import { authenticate } from '../../../middleware/authentication.js';
import { hasRole } from '../../../middleware/authorization.js';
import { validationHandler } from '../../../middleware/validation-handler.js';
import { ROLES } from '../../../constants/roles.js';
import {
  createCustomerValidation,
  listCustomersValidation,
  getCustomerValidation,
  updateCustomerValidation,
  listCustomerVehiclesValidation,
} from '../validations/customer.validation.js';
import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  listCustomerVehicles,
} from '../controller/customer.controller.js';

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

// BE-017: List and search customers (Any active staff)
router.get('/', authenticate, listCustomersValidation, validationHandler, listCustomers);

// BE-018: View customer profile and financial summary (Any active staff)
router.get('/:customer_id', authenticate, getCustomerValidation, validationHandler, getCustomer);

// BE-019: Edit or deactivate customer (Manager or Admin only)
router.patch(
  '/:customer_id',
  authenticate,
  hasRole(ROLES.MANAGER, ROLES.ADMIN),
  updateCustomerValidation,
  validationHandler,
  updateCustomer,
);

// BE-021: List a customer's vehicles (Any active staff)
router.get(
  '/:customer_id/vehicles',
  authenticate,
  listCustomerVehiclesValidation,
  validationHandler,
  listCustomerVehicles,
);

export default router;