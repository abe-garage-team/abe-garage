import { useState } from 'react';
import ConfirmDialog from '../../../components/common/ConfirmDialog.jsx';
import ErrorMessage from '../../../components/common/ErrorMessage.jsx';
import { recordApproval } from '../../../services/order.service.js';
import { APPROVAL_METHODS } from '../../../constants/orders.js';
import { hasStartedWork } from '../../../utils/order-helpers.js';

export default function ApprovalPanel({ order, onRecorded }) {
  const [method, setMethod] = useState('');

  const [decision, setDecision] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const started = hasStartedWork(order);
  const methodLabel = APPROVAL_METHODS.find((item) => item.value === method)?.label.toLowerCase();

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await recordApproval(order.order_id, { decision, approval_method: method });
      const recorded = decision;
      setDecision(null);
      await onRecorded(recorded);
    } catch (err) {
      setDecision(null);
      setError(err.message || 'Could not record the answer. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ag-card ord-approval" aria-labelledby="order-approval-title">
      <h2 id="order-approval-title" className="ord-card-title">
        Customer decision
      </h2>
      <p>
        This estimate is waiting for the customer’s answer. Record what they told you. No work can
        start until it is approved.
      </p>

      <ErrorMessage message={error} />

      <fieldset className="ord-methods">
        <legend>How did the customer answer?</legend>
        {APPROVAL_METHODS.map((item) => (
          <label key={item.value} className="ord-method">
            <input
              type="radio"
              name="approval-method"
              className="form-check-input"
              value={item.value}
              checked={method === item.value}
              onChange={() => setMethod(item.value)}
            />
            {item.label}
          </label>
        ))}
      </fieldset>

      <div className="ord-actions">
        <button
          type="button"
          className="btn btn-ink"
          disabled={!method || busy}
          onClick={() => setDecision('approved')}
        >
          Record approval
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={!method || busy || started}
          onClick={() => setDecision('declined')}
        >
          Record decline
        </button>
      </div>
      {started && (
        <p className="ord-help mb-0">
          Work has already been done on this order, so it cannot be declined. Remove any unstarted
          extra work with “Edit order”, then approve what is left.
        </p>
      )}

      <ConfirmDialog
        open={decision !== null}
        title={decision === 'approved' ? 'Record approval?' : 'Record decline?'}
        confirmLabel={decision === 'approved' ? 'Approve estimate' : 'Decline estimate'}
        danger={decision === 'declined'}
        busy={busy}
        onConfirm={confirm}
        onCancel={() => setDecision(null)}
      >
        {decision === 'approved' ? (
          <p className="mb-0">
            The customer approved this estimate {methodLabel}. Work on the order can then start.
          </p>
        ) : (
          <p className="mb-0">
            The customer declined this estimate {methodLabel}. A declined order becomes read-only
            and no work can be done on it.
          </p>
        )}
      </ConfirmDialog>
    </section>
  );
}
