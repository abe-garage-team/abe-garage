import { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import ErrorMessage from '../../../components/common/ErrorMessage.jsx';
import FormField from '../../../components/common/FormField.jsx';
import { updateOrder } from '../../../services/order.service.js';
import { LINE_STATUS_LABELS, NOTE_MAX_LENGTH, ORDER_STATUS } from '../../../constants/orders.js';
import {
  canEditLines,
  fieldErrors,
  isFutureLocal,
  isValidMoney,
  toApiDateTime,
  toLocalInputValue,
} from '../../../utils/order-helpers.js';

const toCents = (value) => Math.round(Number(value) * 100);


export default function EditOrderForm({ order, onSaved, onCancel }) {
  const editLines = canEditLines(order);
  const initialReady = toLocalInputValue(order.estimated_ready_date);

  const [readyDate, setReadyDate] = useState(initialReady);
  const [notes, setNotes] = useState(order.notes_for_customer ?? '');
  const [internalNotes, setInternalNotes] = useState(order.internal_notes ?? '');
  const [lines, setLines] = useState(() =>
    (order.lines ?? []).map((line) => ({
      service_id: line.service_id,
      name: line.service_name,
      progress: Number(line.line_status),
      original: line.line_price,
      price: line.line_price,
      removed: false,
    })),
  );

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);


  function clearError(field) {
    setErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous));
  }

  function changeLine(serviceId, changes) {
    clearError('lines');
    setLines((previous) =>
      previous.map((line) => (line.service_id === serviceId ? { ...line, ...changes } : line)),
    );
  }

  function prepare() {
    const changes = {};
    const found = {};

    if (readyDate !== initialReady) {
      if (!readyDate) found.estimated_ready_date = 'Choose a ready date.';
      else if (order.status !== ORDER_STATUS.COMPLETED && !isFutureLocal(readyDate)) {
        found.estimated_ready_date = 'The ready date must be in the future.';
      } else changes.estimated_ready_date = toApiDateTime(readyDate);
    }
    if (notes.trim() !== (order.notes_for_customer ?? '').trim()) {
      if (notes.length > NOTE_MAX_LENGTH) {
        found.notes_for_customer = `Keep this under ${NOTE_MAX_LENGTH} characters.`;
      } else changes.notes_for_customer = notes.trim();
    }
    if (internalNotes.trim() !== (order.internal_notes ?? '').trim()) {
      if (internalNotes.length > NOTE_MAX_LENGTH) {
        found.internal_notes = `Keep this under ${NOTE_MAX_LENGTH} characters.`;
      } else changes.internal_notes = internalNotes.trim();
    }

    if (editLines) {
      const remaining = lines.filter((line) => !line.removed);
      const badPrice = remaining.find((line) => !isValidMoney(line.price));
      if (remaining.length === 0) found.lines = 'At least one service must remain on the order.';
      else if (badPrice) {
        found.lines = `The price for ${badPrice.name} must look like 50 or 50.00 (no negatives).`;
      } else {
        const changed =
          lines.some((line) => line.removed) ||
          remaining.some((line) => toCents(line.price) !== toCents(line.original));
        if (changed) {
          changes.lines = remaining.map((line) => ({
            service_id: line.service_id,
            line_price: line.price.trim(),
          }));
        }
      }
    }
    return { changes, found };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    const { changes, found } = prepare();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (Object.keys(changes).length === 0) {
      setFormError('You have not changed anything yet.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateOrder(order.order_id, changes);
      onSaved(updated);
    } catch (err) {
      setSaving(false);
      const server = fieldErrors(err);
      const mapped = {};
      Object.entries(server).forEach(([key, message]) => {
        mapped[key.startsWith('lines') ? 'lines' : key] = message;
      });
      setErrors(mapped);
      setFormError(Object.keys(mapped).length === 0 ? err.message || 'Could not save.' : '');
    }
  }

  return (
    <form className="ag-card" onSubmit={handleSubmit} noValidate aria-labelledby="order-edit-title">
      <h2 id="order-edit-title" className="ord-card-title">
        Edit order
      </h2>
      <ErrorMessage message={formError} />

      {editLines ? (
        <fieldset className="ord-edit-lines">
          <legend>Services and prices</legend>
          <ul>
            {lines.map((line) => (
              <li key={line.service_id} className={line.removed ? 'removed' : undefined}>
                <span className="ord-edit-name">
                  {line.name}
                  {line.progress > 0 && (
                    <small> · {LINE_STATUS_LABELS[line.progress]} (locked)</small>
                  )}
                </span>
                <input
                  className="form-control ord-price-input"
                  inputMode="decimal"
                  aria-label={`Price for ${line.name}`}
                  value={line.price}
                  disabled={line.removed || line.progress > 0}
                  onChange={(event) => changeLine(line.service_id, { price: event.target.value })}
                />
                {line.progress === 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => changeLine(line.service_id, { removed: !line.removed })}
                    aria-label={`${line.removed ? 'Keep' : 'Remove'} ${line.name}`}
                  >
                    {line.removed ? (
                      <RotateCcw size={16} aria-hidden="true" />
                    ) : (
                      <Trash2 size={16} aria-hidden="true" />
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {errors.lines && (
            <span className="field-error" role="alert">
              {errors.lines}
            </span>
          )}
        </fieldset>
      ) : (
        <p className="ord-help">
          Services and prices can no longer be changed because the estimate was approved. Use “Add
          extra work” to add more.
        </p>
      )}

      <FormField
        id="edit-ready-date"
        label="Estimated ready date"
        type="datetime-local"
        value={readyDate}
        onChange={(event) => {
          setReadyDate(event.target.value);
          clearError('estimated_ready_date');
        }}
        error={errors.estimated_ready_date}
      />
      <FormField
        id="edit-notes"
        as="textarea"
        rows={3}
        label="Note for the customer"
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value);
          clearError('notes_for_customer');
        }}
        error={errors.notes_for_customer}
      />
      <FormField
        id="edit-internal-notes"
        as="textarea"
        rows={3}
        label="Internal notes (staff only)"
        value={internalNotes}
        onChange={(event) => {
          setInternalNotes(event.target.value);
          clearError('internal_notes');
        }}
        error={errors.internal_notes}
      />

      <div className="ord-actions">
        <button type="submit" className="btn btn-brand" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
