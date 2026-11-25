import { useState } from 'react';
import ConfirmDialog from '../../../components/common/ConfirmDialog.jsx';
import ErrorMessage from '../../../components/common/ErrorMessage.jsx';
import FormField from '../../../components/common/FormField.jsx';
import { addExtraJob } from '../../../services/order.service.js';
import { useActiveServices } from '../../../hooks/useActiveServices.js';
import { fieldErrors, formatAmount, isValidMoney } from '../../../utils/order-helpers.js';


export default function ExtraWorkForm({ order, onAdded, onCancel }) {
  const { services, loading, error: loadError, reload } = useActiveServices();
  const [serviceId, setServiceId] = useState('');
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const onOrder = new Set((order.lines ?? []).map((line) => line.service_id));
  const available = services.filter((service) => !onOrder.has(service.service_id));
  const selected = available.find((service) => String(service.service_id) === serviceId);

 
  function clearError(field) {
    setErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    const found = {};
    if (!selected) found.service_id = 'Choose a service to add.';
    if (price.trim() && !isValidMoney(price)) {
      found.line_price = 'Use a price like 90 or 90.50 (no negatives, 2 decimals at most).';
    }
    setErrors(found);
    if (Object.keys(found).length === 0) setConfirming(true);
  }

  async function confirm() {
    setBusy(true);
    const line = { service_id: selected.service_id };
    if (price.trim()) line.line_price = price.trim();
    try {
      await addExtraJob(order.order_id, line);
      await onAdded(selected.name);
    } catch (err) {
      setConfirming(false);
      setBusy(false);
      const server = fieldErrors(err);
      if (server.service_id || server.line_price) {
        setErrors({ service_id: server.service_id, line_price: server.line_price });
      } else {
        setFormError(err.message || 'Could not add the extra work.');
      }
      if (err.status === 404 || err.status === 409) reload();
    }
  }

  return (
    <form className="ord-subform" onSubmit={handleSubmit} noValidate>
      <h3>Add extra work</h3>
      {loadError && <ErrorMessage message={loadError} />}
      <ErrorMessage message={formError} />

      <FormField
        id="extra-service"
        as="select"
        label="Service"
        value={serviceId}
        onChange={(event) => {
          setServiceId(event.target.value);
          clearError('service_id');
        }}
        error={errors.service_id}
        disabled={loading}
      >
        <option value="">{loading ? 'Loading services…' : 'Choose a service'}</option>
        {available.map((service) => (
          <option key={service.service_id} value={service.service_id}>
            {service.name} — {formatAmount(service.price, order.currency)}
          </option>
        ))}
      </FormField>
      <FormField
        id="extra-price"
        label="Price (optional)"
        inputMode="decimal"
        placeholder={
          selected ? `Catalogue price: ${selected.price}` : 'Leave empty to use the catalogue price'
        }
        value={price}
        onChange={(event) => {
          setPrice(event.target.value);
          clearError('line_price');
        }}
        error={errors.line_price}
      />

      <div className="ord-actions">
        <button type="submit" className="btn btn-brand" disabled={busy}>
          Add extra work
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Add extra work?"
        confirmLabel="Add and request approval"
        busy={busy}
        onConfirm={confirm}
        onCancel={() => setConfirming(false)}
      >
        <p className="mb-0">
          Adding {selected?.name} sends this order back to “Awaiting approval”. All work is paused
          until the customer approves the new total.
        </p>
      </ConfirmDialog>
    </form>
  );
}
