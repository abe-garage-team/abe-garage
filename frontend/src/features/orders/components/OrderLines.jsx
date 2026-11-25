import { LINE_STATUS_LABELS } from '../../../constants/orders.js';
import { formatAmount } from '../../../utils/order-helpers.js';

export default function OrderLines({ order, children }) {
  const lines = order.lines ?? [];
  const vatRate = Number(order.vat_rate);

  return (
    <section className="ag-card" aria-labelledby="order-lines-title">
      <div className="card-title-row">
        <h2 id="order-lines-title">Services</h2>
        {children}
      </div>

      <div className="table-responsive">
        <table className="table align-middle ord-table">
          <caption className="visually-hidden">Services on order {order.order_id}</caption>
          <thead>
            <tr>
              <th scope="col">Service</th>
              <th scope="col">Technician</th>
              <th scope="col">Progress</th>
              <th scope="col" className="text-end">Hours</th>
              <th scope="col" className="text-end">Price</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.line_id}>
                <td>
                  <span className="ord-line-name">{line.service_name}</span>
                  {line.service_description && (
                    <span className="ord-line-desc">{line.service_description}</span>
                  )}
                  {line.technician_note && (
                    <span className="ord-line-desc">Technician note: {line.technician_note}</span>
                  )}
                </td>
                <td>{line.technician_name || <span className="muted">Unassigned</span>}</td>
                <td>{LINE_STATUS_LABELS[line.line_status] ?? '—'}</td>
                <td className="text-end ord-num">{line.labor_hours}</td>
                <td className="text-end ord-num">
                  {formatAmount(line.line_price, order.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ord-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatAmount(order.subtotal, order.currency)}</dd>
        </div>
        <div>
          <dt>VAT{Number.isFinite(vatRate) ? ` (${vatRate}%)` : ''}</dt>
          <dd>{formatAmount(order.vat_amount, order.currency)}</dd>
        </div>
        <div className="grand">
          <dt>Total</dt>
          <dd>{formatAmount(order.total, order.currency)}</dd>
        </div>
      </dl>
    </section>
  );
}
