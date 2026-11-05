import { Router } from 'express';
import { authenticate } from '../../../middleware/authentication.js';
import {
  createOrderValidation,
  listOrdersValidation,
  getOrderParamsValidation,
  updateOrderValidation,
  recordApprovalValidation,
  addExtraJobValidation,
  getEstimateValidation,
} from '../validations/order.validation.js';
import {
  createOrderController,
  listOrdersController,
  getOrderByIdController,
  updateOrderController,
  recordApprovalController,
  addExtraJobController,
  getEstimateController,
} from '../controller/order.controller.js';
const router = Router();

// Mounted at /api/orders.
// BE-029  POST  /
router.post('/', authenticate, createOrderValidation, createOrderController);

// BE-030  GET   /
router.get('/', authenticate, listOrdersValidation, listOrdersController);

// BE-031  GET   /:order_id
router.get('/:order_id', authenticate, getOrderParamsValidation, getOrderByIdController);
// BE-032  PATCH /:order_id
router.patch('/:order_id', authenticate, updateOrderValidation, updateOrderController);
// BE-033  PATCH /:order_id/approval
router.patch(
  '/:order_id/approval',
  authenticate,
  recordApprovalValidation,
  recordApprovalController,
);
// BE-034  POST  /:order_id/lines
router.post('/:order_id/lines', authenticate, addExtraJobValidation, addExtraJobController);
// BE-039  GET   /:order_id/estimate
router.get('/:order_id/estimate', authenticate, getEstimateValidation, getEstimateController);

export default router;
