import { Router } from 'express';
import { requireSetupKey } from '../../../middleware/setup-access.js';
import { rejectRequestBody } from '../../../middleware/validators.js';
import { healthController, installController } from '../controller/setup.controller.js';

const router = Router();

// Mounted at /api.
router.get('/health', healthController);
router.post('/install', requireSetupKey, rejectRequestBody, installController);

export default router;
