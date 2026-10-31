import * as customerService from '../service/customer.service.js';
import { asyncHandler } from '../../../utils/async-handler.js';
import { respond } from '../../../utils/respond.js';

// Controller to handle customer registration (BE-016)
export const createCustomer = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, phone, active } = req.body;

  const customer = await customerService.createCustomer({
    first_name,
    last_name,
    email,
    phone,
    active,
  });

  return respond(res, customer, 'Register customer successful', 201);
});