import { pool } from '../../../config/db.js';
import { AppError } from '../../../utils/errors/index.js';

// Status name lookup mapping status ID to contractual human-readable label
const STATUS_NAMES = {
  1: 'Awaiting approval',
  2: 'Approved',
  3: 'In progress',
  4: 'Completed',
  5: 'Declined',
};

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

// Service to fetch customer profile, owned vehicles, recent orders, and financial summary (BE-018)
export async function getCustomer(customerId) {
  // 1. Fetch customer details
  const [customerRows] = await pool.execute(
    `SELECT customer_id, first_name, last_name, email, phone, active, created_at
     FROM customers
     WHERE customer_id = ?`,
    [customerId],
  );

  if (customerRows.length === 0) {
    throw new AppError('Customer not found', 404);
  }

  const customer = customerRows[0];

  // 2. Fetch all vehicles owned by this customer
  const [vehicleRows] = await pool.execute(
    `SELECT vehicle_id, customer_id, year, make, model, vehicle_type AS type, mileage, plate, vin, color
     FROM vehicles
     WHERE customer_id = ?
     ORDER BY vehicle_id ASC`,
    [customerId],
  );

  // 3. Count total orders placed by this customer across all vehicles
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM orders o
     JOIN vehicles v ON v.vehicle_id = o.vehicle_id
     WHERE v.customer_id = ?`,
    [customerId],
  );
  const orderCount = Number(countRows[0]?.total || 0);

  // 4. Fetch the 10 most recent orders with calculated financial totals and payment status
  const [orderRows] = await pool.execute(
    `SELECT vo.order_id, vo.customer_id, vo.vehicle_id, v.plate, vo.status,
            vo.subtotal, vo.vat_rate, vo.vat_amount, vo.total, vo.currency,
            vo.paid, vo.created_at, vo.estimated_ready_date, vo.completed_at
     FROM v_orders vo
     JOIN vehicles v ON v.vehicle_id = vo.vehicle_id
     WHERE vo.customer_id = ?
     ORDER BY vo.created_at DESC, vo.order_id DESC
     LIMIT 10`,
    [customerId],
  );

  const customerFullName = `${customer.first_name} ${customer.last_name}`;

  const recentOrders = orderRows.map((order) => ({
    order_id: Number(order.order_id),
    customer_id: Number(order.customer_id),
    customer_name: customerFullName,
    vehicle_id: Number(order.vehicle_id),
    plate: order.plate,
    status: Number(order.status),
    status_name: STATUS_NAMES[order.status] || 'Unknown',
    subtotal: Number(order.subtotal).toFixed(2),
    vat_rate: Number(order.vat_rate).toFixed(2),
    vat_amount: Number(order.vat_amount).toFixed(2),
    total: Number(order.total).toFixed(2),
    currency: order.currency,
    paid: Boolean(order.paid),
    created_at: order.created_at,
    estimated_ready_date: order.estimated_ready_date,
    completed_at: order.completed_at || null,
  }));

  // 5. Calculate unpaid total summing only completed orders (status = 4) where paid = false
  const [unpaidRows] = await pool.execute(
    `SELECT COALESCE(SUM(vo.total), 0.00) AS unpaid_total
     FROM v_orders vo
     WHERE vo.customer_id = ? AND vo.status = 4 AND vo.paid = 0`,
    [customerId],
  );

  const unpaidTotal = Number(unpaidRows[0]?.unpaid_total || 0).toFixed(2);
  const currency = recentOrders.length > 0 ? recentOrders[0].currency : 'ETB';

  return {
    customer_id: Number(customer.customer_id),
    first_name: customer.first_name,
    last_name: customer.last_name,
    email: customer.email,
    phone: customer.phone,
    active: Boolean(customer.active),
    created_at: customer.created_at,
    vehicles: vehicleRows.map((v) => ({
      vehicle_id: Number(v.vehicle_id),
      customer_id: Number(v.customer_id),
      year: Number(v.year),
      make: v.make,
      model: v.model,
      type: v.type,
      mileage: Number(v.mileage),
      plate: v.plate,
      vin: v.vin || null,
      color: v.color,
    })),
    recent_orders: recentOrders,
    order_count: orderCount,
    unpaid_total: unpaidTotal,
    currency,
  };
}

// Aliases for compatibility
export const getCustomerService = getCustomer;
export const getCustomerProfile = getCustomer;