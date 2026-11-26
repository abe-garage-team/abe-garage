import { withTransaction } from '../../../config/db.js';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  AppError,
} from '../../../utils/errors/index.js';
import { presentInvoice } from './invoice.presenter.js';

export function createBillingService({ transaction = withTransaction } = {}) {
  async function issueInvoiceService(orderId, actorId) {
    if (
      !Number.isSafeInteger(orderId) ||
      orderId < 1 ||
      orderId > 4294967295 ||
      !Number.isSafeInteger(actorId) ||
      actorId < 1
    ) {
      throw new BadRequestError('Order and actor IDs must be positive integers');
    }
    return transaction(async (db) => {
      // Parent-first locking serializes concurrent issuers and order mutations.
      const [[order]] = await db.execute(
        'SELECT order_id, vehicle_id, status, vat_rate, currency FROM orders WHERE order_id = ? FOR UPDATE',
        [orderId],
      );
      if (!order) throw new NotFoundError('Order not found');
      let [[invoice]] = await db.execute('SELECT * FROM invoices WHERE order_id = ? FOR UPDATE', [
        orderId,
      ]);
      const [lines] = await db.execute(
        `SELECT ol.line_id, ol.line_status, ol.agreed_price AS line_price,
                sv.name AS service_name, sv.description
         FROM order_lines ol
         JOIN service_versions sv ON sv.service_version_id = ol.service_version_id
         WHERE ol.order_id = ? ORDER BY ol.line_id FOR UPDATE`,
        [orderId],
      );
      const created = !invoice;
      if (
        created &&
        (Number(order.status) !== 4 ||
          lines.length === 0 ||
          lines.some((line) => Number(line.line_status) !== 2))
      ) {
        throw new ConflictError('Only completed orders can be invoiced', {
          code: 'ORDER_NOT_COMPLETED',
        });
      }
      // Ownership is immutable; lock identity sources while capturing the first document.
      const [[identity]] = await db.execute(
        `SELECT v.*, c.first_name, c.last_name, c.email, c.phone
         FROM vehicles v JOIN customers c ON c.customer_id = v.customer_id
         WHERE v.vehicle_id = ? FOR SHARE`,
        [order.vehicle_id],
      );
      if (!identity) throw new AppError('Order identity could not be loaded', 500);
      order.customer_id = identity.customer_id;
      if (created) {
        const [[garage]] = await db.execute(
          'SELECT * FROM garage_settings WHERE settings_id = 1 FOR SHARE',
        );
        if (!garage) throw new AppError('Garage settings not configured', 500);
        const number = `INV-${String(orderId).padStart(6, '0')}`;
        await db.execute(
          `INSERT INTO invoices (
            order_id, invoice_number, issued_by,
            garage_name, garage_address, garage_phone, garage_email,
            customer_first_name, customer_last_name, customer_email, customer_phone,
            vehicle_year, vehicle_make, vehicle_model, vehicle_type, vehicle_mileage,
            vehicle_plate, vehicle_vin, vehicle_color
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            number,
            actorId,
            garage.name,
            garage.address,
            garage.phone,
            garage.email,
            identity.first_name,
            identity.last_name,
            identity.email,
            identity.phone,
            identity.year,
            identity.make,
            identity.model,
            identity.vehicle_type,
            identity.mileage,
            identity.plate,
            identity.vin,
            identity.color,
          ],
        );
        [[invoice]] = await db.execute('SELECT * FROM invoices WHERE order_id = ?', [orderId]);
        await db.execute(
          'INSERT INTO order_history (order_id, employee_id, action) VALUES (?, ?, ?)',
          [orderId, actorId, 'invoice_issued'],
        );
      }
      const [[payment]] = await db.execute(
        'SELECT paid_at, received_by FROM cash_payments WHERE invoice_id = ? FOR SHARE',
        [invoice.invoice_id],
      );
      return { created, invoice: presentInvoice({ invoice, order, lines, payment }) };
    });
  }
  return { issueInvoiceService };
}

export const { issueInvoiceService } = createBillingService();
