import { Router } from 'express';
import { authenticate } from '../../../middleware/authentication.js';
import { hasRole } from '../../../middleware/authorization.js';
import { ROLES } from '../../../constants/roles.js';
import { issueInvoiceValidation } from '../validations/billing.validation.js';
import { issueInvoiceController } from '../controller/billing.controller.js';

const router = Router();

// Mounted at /api/orders; GET invoice/payment routes remain BE-041/BE-042.
router.post(
  '/:order_id/invoice',
  authenticate,
  hasRole(ROLES.MANAGER, ROLES.ADMIN),
  issueInvoiceValidation,
  issueInvoiceController,
);

export default router;
