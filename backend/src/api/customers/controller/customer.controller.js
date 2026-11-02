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

// Controller to handle viewing customer profile and financial summary (BE-018)
export const getCustomer = asyncHandler(async (req, res) => {
  const { customer_id } = req.params;

  const profile = await customerService.getCustomer(customer_id);

  return respond(res, profile, 'View customer profile and financial summary successful', 200);
});

// Aliases for compatibility
export const getCustomerController = getCustomer;
export const getCustomerProfile = getCustomer;
