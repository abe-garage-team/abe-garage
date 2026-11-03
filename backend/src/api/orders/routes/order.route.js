import { Router } from 'express';
import { authenticate } from '../../../middleware/authentication.js';
import { createOrderValidation } from '../validations/order.validation.js';
import { createOrderController } from '../controller/order.controller.js';
const router = Router();


 // Mounted at /api/orders.
// BE-029  POST  /
router.post(
  "/",
  authenticate,
  createOrderValidation,
  createOrderController
); 
// BE-030  GET   /
// BE-031  GET   /:order_id
// BE-032  PATCH /:order_id
// BE-033  PATCH /:order_id/approval
// BE-034  POST  /:order_id/lines
// BE-039  GET   /:order_id/estimate

// Import your controllers and validation here when the feature is ready.
// Write local paths only; do not repeat /api or the resource prefix.

export default router;
