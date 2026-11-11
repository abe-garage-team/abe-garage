import { asyncHandler } from '../../../utils/async-handler.js';
import { respond } from '../../../utils/respond.js';
import { healthService, installService } from '../service/setup.service.js';

export const healthController = asyncHandler(async (req, res) => {
  const readiness = await healthService();
  return respond(res, readiness, 'Service ready');
});

export const installController = asyncHandler(async (req, res) => {
  const result = await installService();
  return respond(res, result, 'Initialize and lock installation successful', 201);
});
