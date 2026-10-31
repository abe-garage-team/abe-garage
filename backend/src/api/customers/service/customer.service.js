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