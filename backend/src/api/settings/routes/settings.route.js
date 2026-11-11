import { Router } from 'express';
import { ROLES } from '../../../constants/roles.js';
import { authenticate } from '../../../middleware/authentication.js';
import { hasRole } from '../../../middleware/authorization.js';
import { rejectRequestBody } from '../../../middleware/validators.js';
import { updateSettingsValidation } from '../validations/settings.validation.js';
import {
  getSettingsController,
  updateSettingsController,
} from '../controller/settings.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', hasRole(ROLES.ADMIN), rejectRequestBody, getSettingsController);
router.patch('/', hasRole(ROLES.ADMIN), updateSettingsValidation, updateSettingsController);

export default router;
