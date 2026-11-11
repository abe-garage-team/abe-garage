import { Router } from 'express';
import { ROLES } from '../../../constants/roles.js';
import { authenticate } from '../../../middleware/authentication.js';
import { hasRole } from '../../../middleware/authorization.js';
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

router.post(
  '/',
  authenticate,
  hasRole(ROLES.MANAGER, ROLES.ADMIN),
  createOrderValidation,
  createOrderController,
);

router.get('/', authenticate, listOrdersValidation, listOrdersController);

router.get('/:order_id', authenticate, getOrderParamsValidation, getOrderByIdController);

router.patch(
  '/:order_id',
  authenticate,
  hasRole(ROLES.MANAGER, ROLES.ADMIN),
  updateOrderValidation,
  updateOrderController,
);

router.patch(
  '/:order_id/approval',
  authenticate,
  hasRole(ROLES.MANAGER, ROLES.ADMIN),
  recordApprovalValidation,
  recordApprovalController,
);

router.post(
  '/:order_id/lines',
  authenticate,
  hasRole(ROLES.MANAGER, ROLES.ADMIN),
  addExtraJobValidation,
  addExtraJobController,
);

router.get(
  '/:order_id/estimate',
  authenticate,
  hasRole(ROLES.MANAGER, ROLES.ADMIN),
  getEstimateValidation,
  getEstimateController,
);

export default router;
