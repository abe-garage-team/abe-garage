import { Router } from 'express';
import { authenticate } from '../../../middleware/authentication.js';
import { getProfileValidation } from '../validations/profile.validation.js';
import { getProfileController } from '../controller/profile.controller.js';

const router = Router();

router.get('/', authenticate, getProfileValidation, getProfileController);

export default router;
