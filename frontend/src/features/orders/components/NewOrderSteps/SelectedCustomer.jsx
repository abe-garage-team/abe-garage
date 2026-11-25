import { Link } from 'react-router-dom';
import { Pencil, X } from 'lucide-react';
import { fullName } from '../../../../utils/order-helpers.js';

export default function SelectedCustomer({ customer, onClear }) {
  const name = fullName(customer);
  return (
    <section className="ag-card ord-selected" aria-label="Chosen customer">
      <div>
        <h2>{name}</h2>
        <dl className="ord-facts">
          <div>
            <dt>Email</dt>
            <dd>{customer.email}</dd>
          </div>
          <div>
            <dt>Phone number</dt>
            <dd>{customer.phone}</dd>
          </div>
          <div>
            <dt>Active customer</dt>
            <dd>{customer.active ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
        <Link
          to={`/admin/customer/${customer.customer_id}/edit`}
          target="_blank"
          rel="noopener noreferrer"
          className="ord-edit-link"
        >
          Edit customer info <Pencil size={14} aria-hidden="true" />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </Link>
      </div>
      <button
        type="button"
        className="ord-remove"
        onClick={onClear}
        aria-label="Choose a different customer"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </section>
  );
}
