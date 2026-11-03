import { Router } from 'express';
import { authenticate } from '../../../middleware/authentication.js';
import { hasRole } from '../../../middleware/authorization.js';
import { validationHandler } from '../../../middleware/validation-handler.js';
import { ROLES } from '../../../constants/roles.js';
import {
  createVehicleValidation,
  getVehicleValidation,
  updateVehicleValidation,
  vehicleHistoryValidation,
} from '../validations/vehicle.validation.js';
import {
  createVehicle,
  getVehicle,
  updateVehicle,
  getVehicleHistory,
} from '../controller/vehicle.controller.js';

const router = Router();

// BE-020: Add vehicle to customer (Manager or Admin only)
router.post(
  '/',
  authenticate,
  hasRole(ROLES.MANAGER, ROLES.ADMIN),
  createVehicleValidation,
  validationHandler,
  createVehicle,
);

// BE-022: View vehicle (Any active staff)
router.get('/:vehicle_id', authenticate, getVehicleValidation, validationHandler, getVehicle);

// BE-023: Edit vehicle details (Manager or Admin only)
router.patch(
  '/:vehicle_id',
  authenticate,
  hasRole(ROLES.MANAGER, ROLES.ADMIN),
  updateVehicleValidation,
  validationHandler,
  updateVehicle,
);

// BE-024: View vehicle service history (Any active staff)
router.get(
  '/:vehicle_id/orders',
  authenticate,
  vehicleHistoryValidation,
  validationHandler,
  getVehicleHistory,
);

export default router;
