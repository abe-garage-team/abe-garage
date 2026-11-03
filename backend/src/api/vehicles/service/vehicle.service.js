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

// Service to add a new vehicle to an active customer (BE-020)
export async function createVehicle({
  customer_id,
  year,
  make,
  model,
  type,
  mileage,
  plate,
  vin = null,
  color,
}) {
  // 1. Verify customer exists
  const [customerRows] = await pool.execute(
    'SELECT customer_id, active FROM customers WHERE customer_id = ?',
    [customer_id],
  );

  if (customerRows.length === 0) {
    throw new AppError('Customer not found', 404);
  }

  // 2. Verify customer is active
  const customer = customerRows[0];
  if (!customer.active) {
    throw new AppError('Customer is inactive', 409);
  }

  // 3. Normalize plate and check uniqueness
  const normalizedPlate = plate.trim().toUpperCase();

  const [existingPlateRows] = await pool.execute(
    'SELECT vehicle_id FROM vehicles WHERE UPPER(plate) = ?',
    [normalizedPlate],
  );

  if (existingPlateRows.length > 0) {
    throw new AppError('Plate already used', 409, {
      errors: { plate: 'Plate number already registered' },
    });
  }

  // 4. Insert vehicle into database
  const cleanVin = vin ? vin.trim() : null;

  const [result] = await pool.execute(
    `INSERT INTO vehicles (customer_id, year, make, model, vehicle_type, mileage, plate, vin, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      customer_id,
      year,
      make.trim(),
      model.trim(),
      type.trim(),
      mileage,
      normalizedPlate,
      cleanVin,
      color.trim(),
    ],
  );

  // 5. Retrieve and return the created vehicle record
  const [rows] = await pool.execute(
    `SELECT vehicle_id, customer_id, year, make, model, vehicle_type AS type, mileage, plate, vin, color
     FROM vehicles
     WHERE vehicle_id = ?`,
    [result.insertId],
  );

  const vehicle = rows[0];
  return {
    vehicle_id: Number(vehicle.vehicle_id),
    customer_id: Number(vehicle.customer_id),
    year: Number(vehicle.year),
    make: vehicle.make,
    model: vehicle.model,
    type: vehicle.type,
    mileage: Number(vehicle.mileage),
    plate: vehicle.plate,
    vin: vehicle.vin || null,
    color: vehicle.color,
  };
}

// Service to fetch a single vehicle by vehicle_id (BE-022)
export async function getVehicle(vehicleId) {
  const [rows] = await pool.execute(
    `SELECT vehicle_id, customer_id, year, make, model, vehicle_type AS type, mileage, plate, vin, color
     FROM vehicles
     WHERE vehicle_id = ?`,
    [vehicleId],
  );

  if (rows.length === 0) {
    throw new AppError('Vehicle not found', 404);
  }

  const vehicle = rows[0];
  return {
    vehicle_id: Number(vehicle.vehicle_id),
    customer_id: Number(vehicle.customer_id),
    year: Number(vehicle.year),
    make: vehicle.make,
    model: vehicle.model,
    type: vehicle.type,
    mileage: Number(vehicle.mileage),
    plate: vehicle.plate,
    vin: vehicle.vin || null,
    color: vehicle.color,
  };
}

// Service to edit vehicle specifications (BE-023)
export async function updateVehicle(vehicleId, updates = {}) {
  // 1. Verify vehicle exists
  const [existingRows] = await pool.execute(
    'SELECT vehicle_id, customer_id, year, make, model, vehicle_type, mileage, plate, vin, color FROM vehicles WHERE vehicle_id = ?',
    [vehicleId],
  );

  if (existingRows.length === 0) {
    throw new AppError('Vehicle not found', 404);
  }

  const existingVehicle = existingRows[0];

  // 2. Validate mileage does not decrease
  if (updates.mileage !== undefined && Number(updates.mileage) < Number(existingVehicle.mileage)) {
    throw new AppError('Mileage cannot decrease', 409, {
      errors: { mileage: 'Mileage cannot decrease' },
    });
  }

  // 3. Validate plate uniqueness if updating plate
  let normalizedPlate;
  if (updates.plate !== undefined) {
    normalizedPlate = updates.plate.trim().toUpperCase();

    const [conflictRows] = await pool.execute(
      'SELECT vehicle_id FROM vehicles WHERE UPPER(plate) = ? AND vehicle_id != ?',
      [normalizedPlate, vehicleId],
    );

    if (conflictRows.length > 0) {
      throw new AppError('Plate already used', 409, {
        errors: { plate: 'Plate number already registered' },
      });
    }
  }

  // 4. Assemble dynamic update fields
  const fields = [];
  const params = [];

  if (updates.year !== undefined) {
    fields.push('year = ?');
    params.push(Number(updates.year));
  }
  if (updates.make !== undefined) {
    fields.push('make = ?');
    params.push(updates.make.trim());
  }
  if (updates.model !== undefined) {
    fields.push('model = ?');
    params.push(updates.model.trim());
  }
  if (updates.type !== undefined) {
    fields.push('vehicle_type = ?');
    params.push(updates.type.trim());
  }
  if (updates.mileage !== undefined) {
    fields.push('mileage = ?');
    params.push(Number(updates.mileage));
  }
  if (updates.plate !== undefined) {
    fields.push('plate = ?');
    params.push(normalizedPlate);
  }
  if (updates.vin !== undefined) {
    fields.push('vin = ?');
    params.push(updates.vin ? updates.vin.trim() : null);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    params.push(updates.color.trim());
  }

  if (fields.length === 0) {
    throw new AppError('No fields provided for update', 400);
  }

  params.push(vehicleId);

  await pool.execute(`UPDATE vehicles SET ${fields.join(', ')} WHERE vehicle_id = ?`, params);

  // 5. Retrieve and return updated vehicle
  const [updatedRows] = await pool.execute(
    `SELECT vehicle_id, customer_id, year, make, model, vehicle_type AS type, mileage, plate, vin, color
     FROM vehicles
     WHERE vehicle_id = ?`,
    [vehicleId],
  );

  const updated = updatedRows[0];
  return {
    vehicle_id: Number(updated.vehicle_id),
    customer_id: Number(updated.customer_id),
    year: Number(updated.year),
    make: updated.make,
    model: updated.model,
    type: updated.type,
    mileage: Number(updated.mileage),
    plate: updated.plate,
    vin: updated.vin || null,
    color: updated.color,
  };
}

// Service to view vehicle service & repair order history (BE-024)
export async function getVehicleHistory(vehicleId, { page = 1, limit = 10 } = {}) {
  // 1. Verify vehicle exists
  const [vehicleRows] = await pool.execute('SELECT vehicle_id FROM vehicles WHERE vehicle_id = ?', [
    vehicleId,
  ]);

  if (vehicleRows.length === 0) {
    throw new AppError('Vehicle not found', 404);
  }

  // 2. Compute pagination boundaries
  const currentPage = Math.max(1, Number(page) || 1);
  const currentLimit = Math.max(1, Math.min(100, Number(limit) || 10));
  const offset = (currentPage - 1) * currentLimit;

  // 3. Count total orders for pagination
  const [countResult] = await pool.execute(
    'SELECT COUNT(*) AS total FROM orders WHERE vehicle_id = ?',
    [vehicleId],
  );
  const total = Number(countResult[0]?.total || 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / currentLimit);

  // 4. Retrieve paginated orders for this vehicle
  const [orderRows] = await pool.query(
    `SELECT vo.order_id, vo.customer_id,
            CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
            vo.vehicle_id, v.plate, vo.status,
            vo.subtotal, vo.vat_rate, vo.vat_amount, vo.total, vo.currency,
            vo.paid, vo.created_at, vo.estimated_ready_date, vo.completed_at
     FROM v_orders vo
     JOIN vehicles v ON v.vehicle_id = vo.vehicle_id
     JOIN customers c ON c.customer_id = vo.customer_id
     WHERE vo.vehicle_id = ?
     ORDER BY vo.created_at DESC, vo.order_id DESC
     LIMIT ? OFFSET ?`,
    [vehicleId, currentLimit, offset],
  );

  // 5. Fetch associated job line snapshots for retrieved orders
  let jobsByOrderId = {};
  if (orderRows.length > 0) {
    const orderIds = orderRows.map((o) => o.order_id);
    const [lineRows] = await pool.query(
      `SELECT ol.order_id, sv.name AS service_name, ol.agreed_price AS line_price
       FROM order_lines ol
       JOIN service_versions sv ON sv.service_version_id = ol.service_version_id
       WHERE ol.order_id IN (?)
       ORDER BY ol.line_id ASC`,
      [orderIds],
    );

    jobsByOrderId = lineRows.reduce((acc, line) => {
      if (!acc[line.order_id]) {
        acc[line.order_id] = [];
      }
      acc[line.order_id].push({
        service_name: line.service_name,
        line_price: Number(line.line_price).toFixed(2),
      });
      return acc;
    }, {});
  }

  // 6. Map and project orders to contractual response shape
  const orders = orderRows.map((order) => ({
    order_id: Number(order.order_id),
    customer_id: Number(order.customer_id),
    customer_name: order.customer_name,
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
    jobs: jobsByOrderId[order.order_id] || [],
  }));

  return {
    orders,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      total_pages: totalPages,
    },
  };
}

// Aliases for compatibility
export const createVehicleService = createVehicle;
export const getVehicleService = getVehicle;
export const updateVehicleService = updateVehicle;
export const vehicleHistoryService = getVehicleHistory;
export const getVehicleHistoryService = getVehicleHistory;
