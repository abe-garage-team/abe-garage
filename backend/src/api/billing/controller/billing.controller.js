import { matchedData } from 'express-validator';
import { issueInvoiceService } from '../service/billing.service.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import { respond } from '../../../utils/respond.js';

export const issueInvoiceController = asyncHandler(async (req, res) => {
  const { order_id } = matchedData(req, { locations: ['params'] });
  const { created, invoice } = await issueInvoiceService(order_id, req.user.employee_id);
  return respond(res, invoice, 'Issue immutable invoice successful', created ? 201 : 200);
});
