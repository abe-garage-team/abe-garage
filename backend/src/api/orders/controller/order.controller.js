import {
  createOrderService,
  listOrdersService,
  getOrderByIdService,
  updateOrderService,
  recordApprovalService,
  addExtraJobService,
  getEstimateService,
} from '../service/order.service.js';
import { matchedData } from 'express-validator';
import { asyncHandler } from '../../../utils/async-handler.js';
import { respond } from '../../../utils/respond.js';

// BE-029 — Create Order Controller
export const createOrderController = asyncHandler(async (req, res) => {
  const result = await createOrderService(req.body, req.user.employee_id);

  return respond(res, result, 'Create repair order and estimate successful', 201);
});

// BE-030 — List and filter orders
export const listOrdersController = asyncHandler(async (req, res) => {
  const filters = matchedData(req, {
    locations: ['query'],
    onlyValidData: true,
  });

  const result = await listOrdersService(filters);

  return respond(res, result, 'List and filter orders successful');
});

// BE-031 — view repair order detail
export const getOrderByIdController = asyncHandler(async (req, res) => {
  const { order_id } = matchedData(req, {
    locations: ['params'],
    onlyValidData: true,
  });

  const order = await getOrderByIdService(order_id);

  return respond(res, order, 'View repair order detail successful');
});

// BE-032 — Edit estimate or order notes
export const updateOrderController = asyncHandler(async (req, res) => {
  const { order_id } = matchedData(req, {
    locations: ['params'],
  });

  const input = matchedData(req, {
    locations: ['body'],
  });

  const result = await updateOrderService(order_id, input, req.user.employee_id);

  return respond(res, result, 'Edit estimate or order notes successful');
});

// BE-033 — Record estimate approval or decline
export const recordApprovalController = asyncHandler(async (req, res) => {
  const { order_id } = matchedData(req, {
    locations: ['params'],
    onlyValidData: true,
  });
  const input = matchedData(req, {
    locations: ['body'],
    onlyValidData: true,
  });

  const result = await recordApprovalService(order_id, input, req.user.employee_id);

  return respond(res, result, 'Record estimate approval or decline successful');
});

// BE-034 — Add extra work and request reapproval
export const addExtraJobController = asyncHandler(async (req, res) => {
  const { order_id } = matchedData(req, {
    locations: ['params'],
    onlyValidData: true,
  });

  const input = matchedData(req, {
    locations: ['body'],
    onlyValidData: true,
  });

  const result = await addExtraJobService(order_id, input, req.user.employee_id);

  return respond(res, result, 'Add extra work and request reapproval successful', 201);
});

// BE-039 — Read printable estimate data
export const getEstimateController = asyncHandler(async (req, res) => {
  const { order_id } = matchedData(req, {
    locations: ['params'],
    onlyValidData: true,
  });

  const estimate = await getEstimateService(order_id);

  return respond(res, estimate, 'Read printable estimate data successful');
});
