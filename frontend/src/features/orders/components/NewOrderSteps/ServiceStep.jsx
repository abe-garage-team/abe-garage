import { useMemo, useState } from 'react';
import ConfirmDialog from '../../../../components/common/ConfirmDialog.jsx';
import ErrorMessage from '../../../../components/common/ErrorMessage.jsx';
import FormField from '../../../../components/common/FormField.jsx';
import { createOrder } from '../../../../services/order.service.js';
import { formatDateTime } from '../../../../utils/format-date.js';
import { NOTE_MAX_LENGTH } from '../../../../constants/orders.js';
import { useActiveServices } from '../../../../hooks/useActiveServices.js';
import {
  defaultReadyDate,
  fieldErrors,
  formatAmount,
  fullName,
  isFutureLocal,
  sumPrices,
  toApiDateTime,
  toLocalInputValue,
} from '../../../../utils/order-helpers.js';


const FORM_FIELDS = ['lines', 'estimated_ready_date', 'notes_for_customer', 'internal_notes'];
function toFormErrors(serverErrors) {
  const mapped = {};
  Object.entries(serverErrors).forEach(([key, message]) => {
    const field = key.startsWith('lines') ? 'lines' : key;
    if (FORM_FIELDS.includes(field) && !mapped[field]) mapped[field] = message;
  });
  return mapped;
}


export default function ServiceStep({ customer, vehicle, onCreated }) {
  const { services, loading, error: loadError, reload } = useActiveServices();

  const [selected, setSelected] = useState(() => new Set());
  const [readyDate, setReadyDate] = useState(() => defaultReadyDate());
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const chosen = useMemo(
    () => services.filter((service) => selected.has(service.service_id)),
    [services, selected],
  );
  const subtotal = sumPrices(chosen.map((service) => service.price));


  function clearError(field) {
    setErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous));
  }

  function toggleService(serviceId) {
    clearError('lines');
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  }


  function validate() {
    const found = {};
    if (chosen.length === 0) found.lines = 'Choose at least one service.';
    if (!readyDate) found.estimated_ready_date = 'Choose when the car should be ready.';
    else if (!isFutureLocal(readyDate)) {
      found.estimated_ready_date = 'The ready date must be in the future.';
    }
    if (notes.length > NOTE_MAX_LENGTH) {
      found.notes_for_customer = `Keep this under ${NOTE_MAX_LENGTH} characters.`;
    }
    if (internalNotes.length > NOTE_MAX_LENGTH) {
      found.internal_notes = `Keep this under ${NOTE_MAX_LENGTH} characters.`;
    }
    return found;
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length === 0) setConfirming(true);
  }

  async function submitOrder() {
    setSubmitting(true);
    setFormError('');
    const payload = {
      customer_id: customer.customer_id,
      vehicle_id: vehicle.vehicle_id,
      lines: chosen.map((service) => ({ service_id: service.service_id })),
      estimated_ready_date: toApiDateTime(readyDate),
    };
    if (notes.trim()) payload.notes_for_customer = notes.trim();
    if (internalNotes.trim()) payload.internal_notes = internalNotes.trim();

    try {
      const order = await createOrder(payload);
      onCreated(order);
    } catch (err) {
      setConfirming(false);
      setSubmitting(false);
      const mapped = toFormErrors(fieldErrors(err));
      setErrors(mapped);
      
      if (Object.keys(mapped).length === 0) {
        setFormError(err.message || 'Could not create the order.');
      }
      if (err.status === 404 || err.status === 409) reload();
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <section className="ag-card" aria-labelledby="service-step-title">
        <h2 id="service-step-title">Choose service</h2>

        {loadError && (
          <div className="alert alert-danger" role="alert">
            {loadError}{' '}
            <button type="button" className="btn btn-link p-0" onClick={reload}>
              Try again
            </button>
          </div>
        )}
        {loading && (
          <p className="ord-empty" role="status">
            Loading services…
          </p>
        )}
        {!loading && !loadError && services.length === 0 && (
          <p className="ord-empty">
            There are no active services. An admin can add them under Services.
          </p>
        )}

        <ul className="ord-service-list">
          {services.map((service) => {
            const checked = selected.has(service.service_id);
            return (
              <li key={service.service_id}>
                <label className={`ord-service${checked ? ' checked' : ''}`}>
                  <span className="ord-service-text">
                    <span className="ord-service-name">{service.name}</span>
                    <span className="ord-service-desc">{service.description}</span>
                  </span>
                  <span className="ord-service-price">{formatAmount(service.price)}</span>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={checked}
                    onChange={() => toggleService(service.service_id)}
                  />
                </label>
              </li>
            );
          })}
        </ul>
        {errors.lines && (
          <span className="field-error" role="alert">
            {errors.lines}
          </span>
        )}
      </section>

      <section className="ag-card" aria-labelledby="details-step-title">
        <h2 id="details-step-title" className="ord-card-title">
          Additional requests
        </h2>

        <ErrorMessage message={formError} />

        <FormField
          id="order-ready-date"
          label="Estimated ready date"
          type="datetime-local"
          value={readyDate}
          min={toLocalInputValue(new Date())}
          onChange={(event) => {
            setReadyDate(event.target.value);
            clearError('estimated_ready_date');
          }}
          error={errors.estimated_ready_date}
          required
        />
        <FormField
          id="order-notes"
          as="textarea"
          rows={4}
          label="Additional requests"
          placeholder="Anything else the customer asked for"
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            clearError('notes_for_customer');
          }}
          error={errors.notes_for_customer}
        />
        <p className="ord-help">
          Saved with the order as a note for the customer. To add extra priced work, use “Add extra
          work” on the order page after it is created.
        </p>
        <FormField
          id="order-internal-notes"
          as="textarea"
          rows={3}
          label="Internal notes (staff only)"
          placeholder="Optional. Never shown to the customer"
          value={internalNotes}
          onChange={(event) => {
            setInternalNotes(event.target.value);
            clearError('internal_notes');
          }}
          error={errors.internal_notes}
        />

        <div className="ord-submit-row">
          <p className="ord-subtotal" aria-live="polite">
            {chosen.length} {chosen.length === 1 ? 'service' : 'services'} · subtotal before VAT{' '}
            <strong>{formatAmount(subtotal)}</strong>
          </p>
          <button type="submit" className="btn btn-brand" disabled={submitting || loading}>
            Submit order
          </button>
        </div>
        <p className="ord-help mb-0">
          This is a preview. The final subtotal, VAT and total are calculated when the order is
          created.
        </p>
      </section>

      <ConfirmDialog
        open={confirming}
        title="Create this order?"
        confirmLabel="Create order"
        busy={submitting}
        onConfirm={submitOrder}
        onCancel={() => setConfirming(false)}
      >
        <dl className="ord-confirm-list">
          <div>
            <dt>Customer</dt>
            <dd>{fullName(customer)}</dd>
          </div>
          <div>
            <dt>Vehicle</dt>
            <dd>
              {vehicle.year} {vehicle.make} {vehicle.model} ·{' '}
              <span className="mono">{vehicle.plate}</span>
            </dd>
          </div>
          <div>
            <dt>Services</dt>
            <dd>{chosen.map((service) => service.name).join(', ')}</dd>
          </div>
          <div>
            <dt>Ready by</dt>
            <dd>{formatDateTime(toApiDateTime(readyDate))}</dd>
          </div>
        </dl>
        <p className="mb-0">
          The order starts as “Awaiting approval” until the customer agrees to the estimate.
        </p>
      </ConfirmDialog>
    </form>
  );
}
