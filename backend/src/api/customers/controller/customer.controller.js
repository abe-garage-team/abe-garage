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



// Controller to handle customer listing and search (BE-017)
export const listCustomers = asyncHandler(async (req, res) => {
  const { search, active, page, limit } = req.query;

  const result = await customerService.listCustomers({
    search,
    active,
    page,
    limit,
  });

  return respond(res, result, 'List and search customers successful', 200);
});