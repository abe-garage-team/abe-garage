import {
  createOrderService,
  listOrdersService,
  getOrderByIdService,
  updateOrderService,
  recordApprovalService,
} from '../service/order.service.js';
import { matchedData } from 'express-validator';

// BE-029 — Create Order Controller
export const createOrderController = async (req, res, next) => {
  try {
    const result = await createOrderService(req.body, req.user.employee_id);

    return res.status(201).json({
      status: 'success',
      message: 'Create repair order and estimate successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// BE-030 — List orders controller
export const listOrdersController = async (req, res, next) => {
  try {
    // Collect only fields validated from query parameters.
    const filters = matchedData(req, {
      locations: ['query'],
      onlyValidData: true,
    });

    const result = await listOrdersService(filters);

    return res.status(200).json({
      status: 'success',
      message: 'List and filter orders successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// BE-031 — Get single repair order

export const getOrderByIdController = async (req, res, next) => {
  try {
    // Extract validated URL parameters
    const { order_id } = matchedData(req, {
      locations: ['params'],
      onlyValidData: true,
    });

    const order = await getOrderByIdService(order_id);

    return res.status(200).json({
      status: 'success',
      message: 'Get order details successful',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// BE-032 — Edit estimate or order notes
export const updateOrderController = async (req, res, next) => {
  try {
    const { order_id } = matchedData(req, {
      locations: ['params'],
    });

    const input = matchedData(req, {
      locations: ['body'],
    });

    // Use your team's verified authentication context.
    const actorId = req.user.employee_id;

    const result = await updateOrderService(order_id, input, actorId);

    return res.status(200).json({
      status: 'success',
      message: 'Edit estimate or order notes successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// BE-033 — Record estimate approval or decline
export const recordApprovalController = async (req, res, next) => {
  try {
    const { order_id } = matchedData(req, {
      locations: ['params'],
      onlyValidData: true,
    });

    const input = matchedData(req, {
      locations: ['body'],
      onlyValidData: true,
    });

    const actorId = req.user.employee_id;

    const result = await recordApprovalService(order_id, input, actorId);

    return res.status(200).json({
      status: 'success',
      message: 'Record estimate approval or decline successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
