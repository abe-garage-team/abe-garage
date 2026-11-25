import { Link } from 'react-router-dom';
import { telHref } from '../../../constants/garage.js';
import { formatDateTime } from '../../../utils/format-date.js';
import { APPROVAL_METHODS } from '../../../constants/orders.js';
import { findApprover, fullName } from '../../../utils/order-helpers.js';
import TrackingLink from './TrackingLink.jsx';

export default function OrderSummary({ order, canManage }) {
  const { customer, vehicle } = order;
  const approver = findApprover(order);
  const method = APPROVAL_METHODS.find((item) => item.value === order.approval_method);

  return (
    <div className="ord-grid">
      <section className="ag-card" aria-labelledby="order-customer-title">
        <h2 id="order-customer-title" className="ord-card-title">
          Customer
        </h2>
        <p className="ord-name">
          <Link to={`/admin/customer/${order.customer_id}`}>
            {customer ? fullName(customer) : order.customer_name}
          </Link>
        </p>
        <dl className="ord-facts">
          {customer?.email && (
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${customer.email}`}>{customer.email}</a>
              </dd>
            </div>
          )}
          {customer?.phone && (
            <div>
              <dt>Phone number</dt>
              <dd>
                <a href={telHref(customer.phone)}>{customer.phone}</a>
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section className="ag-card" aria-labelledby="order-vehicle-title">
        <h2 id="order-vehicle-title" className="ord-card-title">
          Vehicle
        </h2>
        <p className="ord-name">
          <Link to={`/admin/vehicle/${order.vehicle_id}`}>
            {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : order.plate}
          </Link>
        </p>
        <dl className="ord-facts">
          <div>
            <dt>Tag</dt>
            <dd className="mono">{order.plate}</dd>
          </div>
          {vehicle?.color && (
            <div>
              <dt>Color</dt>
              <dd>{vehicle.color}</dd>
            </div>
          )}
          {vehicle?.mileage !== undefined && vehicle?.mileage !== null && (
            <div>
              <dt>Mileage</dt>
              <dd>{Number(vehicle.mileage).toLocaleString('en-US')}</dd>
            </div>
          )}
          {vehicle?.vin && (
            <div>
              <dt>Serial</dt>
              <dd className="mono">{vehicle.vin}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="ag-card" aria-labelledby="order-info-title">
        <h2 id="order-info-title" className="ord-card-title">
          Order
        </h2>
        <dl className="ord-facts">
          <div>
            <dt>Created</dt>
            <dd>{formatDateTime(order.created_at)}</dd>
          </div>
          <div>
            <dt>Ready by</dt>
            <dd>{formatDateTime(order.estimated_ready_date)}</dd>
          </div>
          {order.completed_at && (
            <div>
              <dt>Completed</dt>
              <dd>{formatDateTime(order.completed_at)}</dd>
            </div>
          )}
          {order.approved_at && (
            <div>
              <dt>Approved</dt>
              <dd>
                {formatDateTime(order.approved_at)}
                {method && ` · ${method.label.toLowerCase()}`}
                {approver && ` · recorded by ${approver}`}
              </dd>
            </div>
          )}
          {order.paid_at && (
            <div>
              <dt>Paid</dt>
              <dd>{formatDateTime(order.paid_at)}</dd>
            </div>
          )}
          {order.notes_for_customer && (
            <div>
              <dt>Note for customer</dt>
              <dd className="ord-note">{order.notes_for_customer}</dd>
            </div>
          )}
          {order.internal_notes && (
            <div>
              <dt>Internal notes</dt>
              <dd className="ord-note">{order.internal_notes}</dd>
            </div>
          )}
        </dl>
        {canManage && order.tracking_url && (
          <div className="ord-tracking">
            <p className="ord-label">Customer tracking link</p>
            <TrackingLink url={order.tracking_url} />
          </div>
        )}
      </section>
    </div>
  );
}
