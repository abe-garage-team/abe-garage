import { Router } from 'express';
import { authenticate } from '../../../middleware/authentication.js';
import { hasRole } from '../../../middleware/authorization.js';
import { validationHandler } from '../../../middleware/validation-handler.js';
import { ROLES } from '../../../constants/roles.js';
import {
    createVehicleValidation,
    getVehicleValidation,
} from '../validations/vehicle.validation.js';
import { createVehicle, getVehicle } from '../controller/vehicle.controller.js';

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

// Planned endpoints:
// BE-023  PATCH /:vehicle_id
// BE-024  GET   /:vehicle_id/orders

export default router;