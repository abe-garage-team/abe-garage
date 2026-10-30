import { moneyToMinor, formatMinor, calculateVat } from '../../../shared/order-domain/money.js';
import { toIsoUtc } from '../../../utils/serialize.js';

// Identity comes from the issued document; financial facts are protected by schema triggers.
export function presentInvoice({ invoice, order, lines, payment }) {
  const subtotal = lines.reduce((sum, line) => sum + moneyToMinor(line.line_price), 0n);
  const vat = calculateVat(subtotal, order.vat_rate);
  const vatRate = formatMinor(moneyToMinor(order.vat_rate));
  return {
    order_id: Number(order.order_id),
    document_type: 'invoice',
    issued_at: toIsoUtc(invoice.issued_at),
    garage: {
      settings_id: 1,
      name: invoice.garage_name,
      address: invoice.garage_address,
      phone: invoice.garage_phone,
      email: invoice.garage_email,
      vat_rate: vatRate,
    },
    customer: {
      first_name: invoice.customer_first_name,
      last_name: invoice.customer_last_name,
      email: invoice.customer_email,
      phone: invoice.customer_phone,
    },
    vehicle: {
      vehicle_id: Number(order.vehicle_id),
      customer_id: Number(order.customer_id),
      year: Number(invoice.vehicle_year),
      make: invoice.vehicle_make,
      model: invoice.vehicle_model,
      type: invoice.vehicle_type,
      mileage: Number(invoice.vehicle_mileage),
      plate: invoice.vehicle_plate,
      vin: invoice.vehicle_vin ?? null,
      color: invoice.vehicle_color,
    },
    lines: lines.map((line) => ({
      line_id: Number(line.line_id),
      service_name: line.service_name,
      description: line.description,
      line_price: formatMinor(moneyToMinor(line.line_price)),
    })),
    subtotal: formatMinor(subtotal),
    vat_rate: vatRate,
    vat_amount: formatMinor(vat),
    total: formatMinor(subtotal + vat),
    currency: order.currency,
    status: Number(order.status),
    invoice_number: invoice.invoice_number,
    paid: Boolean(payment),
    paid_at: toIsoUtc(payment?.paid_at),
    paid_received_by: payment ? Number(payment.received_by) : null,
  };
}
