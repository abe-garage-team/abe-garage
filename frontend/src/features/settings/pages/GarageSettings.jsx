import { useEffect, useState } from 'react';
import { fetchSettings, updateSettings } from '../../../services/settings.service.js';
import FormField from '../../../components/common/FormField.jsx';
import LoadingState from '../../../components/common/LoadingState.jsx';
import ErrorMessage from '../../../components/common/ErrorMessage.jsx';

const FIELDS = ['name', 'address', 'phone', 'email', 'vat_rate'];

// BE-014 reads the row, BE-015 saves only the fields that changed.
// A new VAT rate applies to orders created from now on; existing orders keep theirs.
export default function GarageSettings() {
  const [saved, setSaved] = useState(null); // what the server has
  const [form, setForm] = useState(null); // what the Admin is typing
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchSettings()
      .then((data) => {
        if (!cancelled) {
          setSaved(data);
          setForm(data);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const change = (event) => {
    setNotice(null);
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  async function submit(event) {
    event.preventDefault();
    const changes = {};
    FIELDS.forEach((field) => {
      if (form[field] !== saved[field]) changes[field] = form[field];
    });
    if (Object.keys(changes).length === 0) {
      setNotice('Nothing changed.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await updateSettings(changes);
      setSaved(data);
      setForm(data);
      setNotice('Settings saved.');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (name) => (error?.field === name ? error.message : undefined);

  if (loadError) return <ErrorMessage message={loadError} />;
  if (!form) return <LoadingState message="Loading settings…" />;

  return (
    <>
      <h1 className="page-title">Garage settings</h1>
      <form className="ag-card page-narrow" onSubmit={submit} noValidate>
        {notice && (
          <p className="alert alert-success" role="status">
            {notice}
          </p>
        )}
        <ErrorMessage message={error && !FIELDS.includes(error.field) ? error.message : null} />
        <FormField
          id="name"
          name="name"
          label="Garage name"
          value={form.name}
          onChange={change}
          error={fieldError('name')}
          required
        />
        <FormField
          id="address"
          name="address"
          label="Address"
          as="textarea"
          rows={2}
          value={form.address}
          onChange={change}
          error={fieldError('address')}
          required
        />
        <div className="row">
          <div className="col-md-6">
            <FormField
              id="phone"
              name="phone"
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={change}
              error={fieldError('phone')}
              required
            />
          </div>
          <div className="col-md-6">
            <FormField
              id="email"
              name="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={change}
              error={fieldError('email')}
              required
            />
          </div>
        </div>
        <FormField
          id="vat_rate"
          name="vat_rate"
          label="VAT rate (%)"
          type="number"
          min="0"
          max="100"
          step="0.01"
          inputMode="decimal"
          value={form.vat_rate}
          onChange={change}
          error={fieldError('vat_rate')}
          required
        />
        <p className="muted">
          The VAT rate is copied into each order when it is created, so a change here applies to new
          orders only. Existing orders and invoices keep the rate they were made with.
        </p>
        <button type="submit" className="btn btn-brand" disabled={busy}>
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </>
  );
}
