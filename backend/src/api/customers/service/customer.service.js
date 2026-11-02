import { pool } from '../../../config/db.js';
import { AppError } from '../../../utils/errors/index.js';

// Service to register a new customer in the database (BE-016)
export async function createCustomer({ first_name, last_name, email, phone, active = true }) {
  // Check for existing customer with identical email or phone
  const [existing] = await pool.execute(
    'SELECT customer_id, email, phone FROM customers WHERE email = ? OR phone = ?',
    [email, phone],
  );

  if (existing.length > 0) {
    const errors = {};
    if (existing.some((customer) => customer.email.toLowerCase() === email.toLowerCase())) {
      errors.email = 'Email already registered';
    }
    if (existing.some((customer) => customer.phone === phone)) {
      errors.phone = 'Phone number already registered';
    }
    throw new AppError('Customer email or phone already used', 409, { errors });
  }

  // Insert the new customer record
  const [result] = await pool.execute(
    `INSERT INTO customers (first_name, last_name, email, phone, active)
     VALUES (?, ?, ?, ?, ?)`,
    [first_name, last_name, email, phone, active],
  );

  // Retrieve and return the created customer record
  const [rows] = await pool.execute(
    `SELECT customer_id, first_name, last_name, email, phone, active, created_at
     FROM customers
     WHERE customer_id = ?`,
    [result.insertId],
  );

  const customer = rows[0];
  return {
    ...customer,
    active: Boolean(customer.active),
  };
}

// Service to search and list customers with pagination (BE-017)
export async function listCustomers({ search, active, page = 1, limit = 10 }) {
  const currentPage = Math.max(1, Number(page) || 1);
  const currentLimit = Math.max(1, Math.min(100, Number(limit) || 10));
  const offset = (currentPage - 1) * currentLimit;

  const conditions = [];
  const params = [];

  // Filter across name, email, and phone
  if (search && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    conditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
    params.push(term, term, term, term);
  }

  // Filter by active status if requested
  if (active !== undefined && active !== null && active !== '') {
    const isActive = active === 'true' || active === true || active === 1 || active === '1';
    conditions.push('active = ?');
    params.push(isActive ? 1 : 0);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total matching records for pagination
  const [countResult] = await pool.query(
    `SELECT COUNT(*) AS total FROM customers ${whereClause}`,
    params,
  );
  const total = countResult[0]?.total || 0;
  const total_pages = total === 0 ? 0 : Math.ceil(total / currentLimit);

  // Fetch paginated customer records ordered newest first
  const [rows] = await pool.query(
    `SELECT customer_id, first_name, last_name, email, phone, active, created_at
     FROM customers
     ${whereClause}
     ORDER BY created_at DESC, customer_id DESC
     LIMIT ? OFFSET ?`,
    [...params, currentLimit, offset],
  );

  const customers = rows.map((customer) => ({
    ...customer,
    active: Boolean(customer.active),
  }));

  return {
    customers,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      total_pages,
    },
  };
}