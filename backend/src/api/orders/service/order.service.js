import { randomBytes } from "node:crypto";
import { pool, withTransaction } from "../../../config/db.js";
import { AppError } from "../../../utils/errors/AppError.js"; 

//Helper functions
function fail(statusCode, message) {
  throw new AppError(message, statusCode);
}

function cents(value) {
  // to examine the monetary value
  const text = String(value);
  // to validate the format of the monetary value
  // checks if the input contains valid non-negative monetary number with up to two decimal places.
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    fail(500, "Invalid monetary value in database");
  }

  const [whole, fraction = ""] = text.split(".");

  //Convert the whole amount into cents
  //Convert the decimal portion into two digits
  //padEnd() adds characters to the end of a string until it reaches the specified length.
  /*This ensures that values like "5" become "5.00" and "5.5" become "5.50" before conversion. // * Because one decimal digit represents ten cents, not one cent.*/
  return BigInt(whole) * 100n +
    BigInt(fraction.padEnd(2, "0"));
}

function money(value) {
  return `${value / 100n}.${String(value % 100n).padStart(2, "0")}`;
}

function vatCents(subtotal, rate) {
  return (subtotal * cents(rate) + 5000n) / 10000n;
}

function mysqlUtc(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    fail(400, "Invalid estimated ready date");
  }

  return date.toISOString().slice(0, 23).replace("T", " ");
}

function isoUtc(value) {
  if (value == null) return null;

  // MySQL DATETIME strings represent UTC in this project.
  const normalized = String(value).replace(" ", "T");

  const date = new Date(
    /(?:Z|[+-]\d\d:\d\d)$/.test(normalized)
      ? normalized
      : `${normalized}Z`
  );

  if (Number.isNaN(date.getTime())) {
    fail(500, "Invalid database timestamp");
  }

  return date.toISOString();
}

// Shared order reader for BE-029 and BE-031.
// Accepts the transaction connection (POST) or pool (GET).
export async function getOrderDetails(db, orderId) {
  const [[order]] = await db.execute(
    `SELECT * FROM v_orders WHERE order_id = ?`,
    [orderId]
  );
  if (!order) return null;

  // The final schema associates a customer with an order through its vehicle.
  const [[vehicle]] = await db.execute(
    `SELECT * FROM vehicles WHERE vehicle_id = ?`,
    [order.vehicle_id]
  );
  if (!vehicle) fail(500, "Order vehicle could not be loaded");

  const [[customer]] = await db.execute(
    `SELECT * FROM customers WHERE customer_id = ?`,
    [vehicle.customer_id]
  );
  if (!customer) fail(500, "Order customer could not be loaded");

  const [lines] = await db.execute(
    `SELECT
       ol.line_id, ol.order_id, sv.service_id,
       sv.name AS service_name,
       sv.description AS service_description,
       sv.labor_hours,
       ol.agreed_price AS line_price,
       ol.technician_id,
       CASE WHEN e.employee_id IS NULL THEN NULL
            ELSE CONCAT(e.first_name, ' ', e.last_name)
       END AS technician_name,
       ol.line_status, ol.started_at, ol.done_at, ol.technician_note
     FROM order_lines ol
     JOIN service_versions sv
       ON sv.service_version_id = ol.service_version_id
     LEFT JOIN employees e
       ON e.employee_id = ol.technician_id
     WHERE ol.order_id = ?
     ORDER BY ol.line_id`,
    [orderId]
  );

  const [history] = await db.execute(
    `SELECT
       h.history_id, h.order_id, h.employee_id,
       CASE WHEN e.employee_id IS NULL THEN NULL
            ELSE CONCAT(e.first_name, ' ', e.last_name)
       END AS employee_name,
       h.action, h.created_at
     FROM order_history h
     LEFT JOIN employees e ON e.employee_id = h.employee_id
     WHERE h.order_id = ?
     ORDER BY h.history_id`,
    [orderId]
  );

  // The DB view provides the persisted snapshot and financial aggregates.
  const subtotal = cents(order.subtotal);
  const rate = order.vat_rate;
  const vat = vatCents(subtotal, rate);
  const baseUrl = process.env.PUBLIC_FRONTEND_URL;
  const trackingUrl = baseUrl && order.order_hash
    ? `${baseUrl.replace(/\/$/, "")}/order-status/${order.order_hash}`
    : null;

  return {
    order_id: order.order_id,
    customer_id: customer.customer_id,
    customer_name: `${customer.first_name} ${customer.last_name}`,
    vehicle_id: vehicle.vehicle_id,
    plate: vehicle.plate,
    status: Number(order.status),
    status_name: order.status_name ?? (Number(order.status) === 1 ? "Awaiting approval" : null),
    subtotal: money(subtotal),
    vat_rate: String(rate),
    vat_amount: money(vat),
    total: money(subtotal + vat),
    currency: order.currency,
    paid: Boolean(order.paid),
    created_at: isoUtc(order.created_at),
    estimated_ready_date: isoUtc(order.estimated_ready_date),
    completed_at: isoUtc(order.completed_at),
    created_by: order.created_by,
    order_hash: order.order_hash,
    tracking_url: trackingUrl,
    customer: {
      customer_id: customer.customer_id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      active: Boolean(customer.active),
      created_at: isoUtc(customer.created_at)
    },
    vehicle: {
      vehicle_id: vehicle.vehicle_id,
      customer_id: vehicle.customer_id,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      type: vehicle.vehicle_type,
      mileage: vehicle.mileage,
      plate: vehicle.plate,
      vin: vehicle.vin,
      color: vehicle.color
    },
    lines: lines.map(line => ({
      ...line,
      started_at: isoUtc(line.started_at),
      done_at: isoUtc(line.done_at)
    })),
    approved_by: order.approved_by ?? null,
    approved_at: isoUtc(order.approved_at),
    approval_method: order.approval_method ?? null,
    paid_at: isoUtc(order.paid_at),
    paid_received_by: order.paid_received_by ?? null,
    notes_for_customer: order.notes_for_customer,
    internal_notes: order.internal_notes,
    history: history.map(entry => ({
      ...entry,
      created_at: isoUtc(entry.created_at)
    }))
  };
}

//BE-029 
export async function createOrderService(
  input,
  actorId,
) {
  const data = await withTransaction(async (connection) => {
    // 1. Find customer
    const [[customer]] = await connection.execute(
      `SELECT *
       FROM customers
       WHERE customer_id = ?
       FOR UPDATE`,
      [input.customer_id]
    );

    if (!customer) fail(404, "Customer not found");
    if (!customer.active) fail(409, "Customer is inactive");

    // 2. Find vehicle
    const [[vehicle]] = await connection.execute(
      `SELECT *
       FROM vehicles
       WHERE vehicle_id = ?
       FOR UPDATE`,
      [input.vehicle_id]
    );

    if (!vehicle) fail(404, "Vehicle not found");

    if (Number(vehicle.customer_id) !== Number(input.customer_id)) {
      fail(409, "Vehicle does not belong to customer");
    }

    // 3. Read VAT and currency
    const [[settings]] = await connection.execute(
      `SELECT vat_rate, currency
       FROM garage_settings
       WHERE settings_id = 1`
    );

    if (!settings) {
      fail(500, "Garage settings not configured");
    }

    // 4. Validate and lock requested services
    const serviceIds = input.lines
      .map((line) => line.service_id)
      .sort((a, b) => a - b);

    if (new Set(serviceIds).size !== serviceIds.length) {
      fail(400, "Duplicate services are not allowed");
    }

    const selected = [];
    let subtotalCents = 0n;

    for (const serviceId of serviceIds) {
      const [[service]] = await connection.execute(
        `SELECT service_id, active
         FROM services
         WHERE service_id = ?
         FOR UPDATE`,
        [serviceId]
      );

      if (!service) {
        fail(404, `Service ${serviceId} not found`);
      }

      if (!service.active) {
        fail(409, `Service ${serviceId} is inactive`);
      }

      // Select the latest immutable version.
      const [[version]] = await connection.execute(
        `SELECT
           service_version_id,
           service_id,
           name,
           description,
           labor_hours,
           default_price
         FROM service_versions
         WHERE service_id = ?
         ORDER BY version_number DESC
         LIMIT 1`,
        [serviceId]
      );

      if (!version) {
        fail(404, `Service ${serviceId} has no version`);
      }

      selected.push(version);
      subtotalCents += cents(version.default_price);
    }

    // 5. Calculate financial values
    const tax = vatCents(subtotalCents, settings.vat_rate);
  

    // 6. Generate 64-character tracking hash
    const orderHash = randomBytes(32).toString("hex");

    // 7. Insert order
    const [inserted] = await connection.execute(
      `INSERT INTO orders (
         vehicle_id,
         created_by,
         status,
         order_hash,
         vat_rate,
         currency,
         estimated_ready_date,
         notes_for_customer,
         internal_notes
       )
       VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)`,
      [
        input.vehicle_id,
        actorId,
        orderHash,
        settings.vat_rate,
        settings.currency,
        mysqlUtc(input.estimated_ready_date),
        input.notes_for_customer ?? null,
        input.internal_notes ?? null
      ]
    );

    const orderId = inserted.insertId;

    // 8. Insert immutable service references and agreed prices
    for (const version of selected) {
      await connection.execute(
        `INSERT INTO order_lines (
           order_id,
           service_version_id,
           agreed_price,
           line_status
         )
         VALUES (?, ?, ?, 0)`,
        [
          orderId,
          version.service_version_id,
          version.default_price
        ]
      );
    }

    // 9. Record initial history
    await connection.execute(
      `INSERT INTO order_history (
         order_id,
         employee_id,
         action
       )
       VALUES (?, ?, ?)`,
      [orderId, actorId, "order_created"]
    );

    // Read the just-created order within the same transaction.
    const details = await getOrderDetails(connection, orderId);
    if (!details) fail(500, "Created order could not be loaded");
    return details;
  });

  // Notification happens only after successful commit.
  // wait until BE-043 integration.
  
  return data;
}


// ! BE-030 — List and filter orders
const getOrderStatusName = (status) => {
  const statusNames = {
    1: "Awaiting approval",
    2: "Approved",
    3: "In Progress",
    4: "Completed",
    5: "Declined",

};

  return statusNames[status] ?? null;
};

export async function listOrdersService(filters = {}) {
  const {
    search,
    status,
    paid,
    customer_id,
    vehicle_id,
    unpaid_only = false,
    page = 1,
    limit = 10,
  } = filters;

  // Additional protection even when called outside the route.
  if (unpaid_only === true) {
    if (paid === true || (status !== undefined && status !== 4)) {
      fail(
        400,
        "unpaid_only requires status=4 and paid=false"
      );
    }
  }

  const offset = (page - 1) * limit;

  if (!Number.isSafeInteger(offset)) {
    fail(400, "Pagination offset is too large");
  }

  // Build SQL dynamically with allowlisted conditions.
  // User values are always passed as parameters.
  const conditions = [];
  const params = [];

  if (search !== undefined) {
    conditions.push(`(
      c.first_name LIKE ?
      OR c.last_name LIKE ?
      OR CONCAT(c.first_name, ' ', c.last_name) LIKE ?
      OR v.plate LIKE ?
    )`);

    const searchValue = `%${search}%`;

    params.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue
    );
  }

  if (unpaid_only === true) {
    // Unpaid invoice queue: completed AND not paid.
    conditions.push("o.status = 4");
    conditions.push("o.paid = 0");
  } else {
    if (status !== undefined) {
      conditions.push("o.status = ?");
      params.push(status);
    }

    if (paid !== undefined) {
      conditions.push("o.paid = ?");
      params.push(paid ? 1 : 0);
    }
  }

  if (customer_id !== undefined) {
    conditions.push("c.customer_id = ?");
    params.push(customer_id);
  }

  if (vehicle_id !== undefined) {
    conditions.push("o.vehicle_id = ?");
    params.push(vehicle_id);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  // Reuse the order summary view from BE-029/BE-031.
  const fromClause = `
    FROM v_orders o
    INNER JOIN vehicles v
      ON v.vehicle_id = o.vehicle_id
    INNER JOIN customers c
      ON c.customer_id = v.customer_id
  `;

  // Read the count and page from one consistent snapshot.
  // withTransaction() must use the same connection for both reads.
  return await withTransaction(async (connection) => {
    const [[countRow]] = await connection.execute(
      `
        SELECT COUNT(*) AS total
        ${fromClause}
        ${whereClause}
      `,
      params
    );

    const total = Number(countRow.total);

    const [rows] = await connection.execute(
      `
        SELECT
          o.order_id,
          c.customer_id,
          CONCAT(c.first_name, ' ', c.last_name)
            AS customer_name,
          o.vehicle_id,
          v.plate,
          o.status,
          o.subtotal,
          o.vat_rate,
          o.currency,
          o.paid,
          o.created_at,
          o.estimated_ready_date,
          o.completed_at
        ${fromClause}
        ${whereClause}
        ORDER BY o.created_at DESC, o.order_id DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    const orders = rows.map((row) => {
      const subtotal = cents(row.subtotal);
      const vat = vatCents(subtotal, row.vat_rate);

      return {
        order_id: row.order_id,
        customer_id: row.customer_id,
        customer_name: row.customer_name,
        vehicle_id: row.vehicle_id,
        plate: row.plate,
        status: Number(row.status),
        status_name: getOrderStatusName(Number(row.status)),
        subtotal: money(subtotal),
        vat_rate: String(row.vat_rate),
        vat_amount: money(vat),
        total: money(subtotal + vat),
        currency: row.currency,
        paid: Boolean(row.paid),
        created_at: isoUtc(row.created_at),
        estimated_ready_date: isoUtc(row.estimated_ready_date),
        completed_at: isoUtc(row.completed_at),
      };
    });

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  });
}


// BE-031 — Read existing order without writing to database.
export async function getOrderByIdService(orderId) {
  const details = await getOrderDetails(pool, orderId);
  if (!details) fail(404, "Order not found");
  return details;
}


//   BE-032 — Edit estimate or order notes
export async function updateOrderService(
  orderId,
  input,
  actorId
) {
  return await withTransaction(async (connection) => {

    // 1. Lock the order to prevent concurrent edits.
    const [[order]] = await connection.execute(
      `SELECT *
       FROM orders
       WHERE order_id = ?
       FOR UPDATE`,
      [orderId]
    );

    if (!order) {
      fail(404, "Order not found");
    }

    if (Number(order.status) === 5) {
      fail(409, "Declined orders cannot be edited");
    }

    const hasLines = Object.hasOwn(input, "lines");

    if (hasLines && Number(order.status) !== 1) {
      fail(409, "Order lines are not editable in this state");
    }

    // 2. Read and lock existing lines.
    const [existingLines] = await connection.execute(
      `SELECT
         ol.line_id,
         ol.service_version_id,
         ol.agreed_price,
         ol.line_status,
         sv.service_id
       FROM order_lines ol
       JOIN service_versions sv
         ON sv.service_version_id = ol.service_version_id
       WHERE ol.order_id = ?
       ORDER BY ol.line_id
       FOR UPDATE`,
      [orderId]
    );

    // 3. Check invoice issuance.
    const [[invoice]] = await connection.execute(
      `SELECT invoice_id
       FROM invoices
       WHERE order_id = ?
       FOR UPDATE`,
      [orderId]
    );

    if (hasLines && invoice) {
      fail(409, "Issued invoice lines cannot be modified");
    }

    // 4. Update services only when lines were supplied.
    if (hasLines) {

      const requestedIds = new Set(
        input.lines.map(line => Number(line.service_id))
      );

      const existingByService = new Map(
        existingLines.map(line => [
          Number(line.service_id),
          line
        ])
      );

      // 4a. Remove omitted services, but only if unstarted.
      for (const existing of existingLines) {
        const serviceId = Number(existing.service_id);

        if (!requestedIds.has(serviceId)) {
          if (Number(existing.line_status) !== 0) {
            fail(
              409,
              "Cannot remove started or completed work"
            );
          }

          await connection.execute(
            `DELETE FROM order_lines
             WHERE line_id = ?
               AND order_id = ?`,
            [existing.line_id, orderId]
          );
        }
      }

      // 4b. Retain, reprice, or add service lines.
      for (const requested of input.lines) {
        const serviceId = Number(requested.service_id);

        const existing = existingByService.get(serviceId);

        if (existing) {
          // Retained line: preserve its ID and assignment.
          if (requested.line_price !== undefined) {
            const oldPrice = cents(existing.agreed_price);
            const newPrice = cents(requested.line_price);

            if (
              newPrice !== oldPrice &&
              Number(existing.line_status) !== 0
            ) {
              fail(
                409,
                "Cannot reprice started or completed work"
              );
            }

            if (newPrice !== oldPrice) {
              await connection.execute(
                `UPDATE order_lines
                 SET agreed_price = ?
                 WHERE line_id = ?`,
                [
                  money(newPrice),
                  existing.line_id
                ]
              );
            }
          }

          // An unspecified price retains the old snapshot.
          continue;
        }

        // New service: validate current service availability.
        const [[service]] = await connection.execute(
          `SELECT service_id, active
           FROM services
           WHERE service_id = ?
           FOR UPDATE`,
          [serviceId]
        );

        if (!service) {
          fail(404, `Service ${serviceId} not found`);
        }

        if (!service.active) {
          fail(409, `Service ${serviceId} is inactive`);
        }

        const [[version]] = await connection.execute(
          `SELECT
             service_version_id,
             default_price
           FROM service_versions
           WHERE service_id = ?
           ORDER BY version_number DESC
           LIMIT 1`,
          [serviceId]
        );

        if (!version) {
          fail(409, "Service has no available version");
        }

        const agreedPrice =
          requested.line_price !== undefined
            ? money(cents(requested.line_price))
            : money(cents(version.default_price));

        await connection.execute(
          `INSERT INTO order_lines (
             order_id,
             service_version_id,
             agreed_price,
             line_status
           )
           VALUES (?, ?, ?, 0)`,
          [
            orderId,
            version.service_version_id,
            agreedPrice
          ]
        );
      }
    }

    // 5. Prepare optional metadata changes.
    const updates = [];
    const values = [];

    if (input.estimated_ready_date !== undefined) {
      const newDate = new Date(input.estimated_ready_date);

      if (
        Number(order.status) === 4 &&
        (
          !order.completed_at ||
          newDate.getTime() >
            new Date(isoUtc(order.completed_at)).getTime()
        )
      ) {
        fail(
          409,
          "Ready date cannot be later than completion"
        );
      }

      updates.push("estimated_ready_date = ?");
      values.push(mysqlUtc(input.estimated_ready_date));
    }

    if (
      Object.hasOwn(input, "notes_for_customer")
    ) {
      updates.push("notes_for_customer = ?");
      values.push(input.notes_for_customer);
    }

    if (
      Object.hasOwn(input, "internal_notes")
    ) {
      updates.push("internal_notes = ?");
      values.push(input.internal_notes);
    }

    // 6. Update order metadata.
    if (updates.length > 0) {
      await connection.execute(
        `UPDATE orders
         SET ${updates.join(", ")}
         WHERE order_id = ?`,
        [...values, orderId]
      );
    }

    // 7. Append audit history.
    await connection.execute(
      `INSERT INTO order_history (
         order_id,
         employee_id,
         action,
         details
       )
       VALUES (?, ?, ?, ?)`,
      [
        orderId,
        actorId,
        "order_updated",
        JSON.stringify({
          lines_updated: hasLines,
          updated_fields: Object.keys(input)
        })
      ]
    );

    // 8. Return the same BE-031 detail structure.
    const details = await getOrderDetails(
      connection,
      orderId
    );

    if (!details) {
      fail(500, "Updated order could not be loaded");
    }

    return details;
  });
}
