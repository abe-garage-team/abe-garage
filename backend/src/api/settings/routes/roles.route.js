import { Router } from 'express';
import { ROLES } from '../../../constants/roles.js';
import { authenticate } from '../../../middleware/authentication.js';
import { hasRole } from '../../../middleware/authorization.js';
import { rejectRequestBody } from '../../../middleware/validators.js';
import { listRolesController } from '../controller/settings.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', hasRole(ROLES.ADMIN), rejectRequestBody, listRolesController);

export default router;
