import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as authService from '../../../services/auth.service.js';
import FormField from '../../../components/common/FormField.jsx';
import ErrorMessage from '../../../components/common/ErrorMessage.jsx';

// BE-006. The token arrives in the emailed link: /reset-password?token=…
// A used, expired or unknown token gives one generic error from the server.
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    if (form.password !== form.confirm) {
      setError({ field: 'confirm', message: 'The two passwords do not match' });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await authService.resetPassword(token, form.password);
      navigate('/login', {
        replace: true,
        state: { message: 'Your password was changed. Log in with the new one.' },
      });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (name) => (error?.field === name ? error.message : undefined);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Reset link missing</h1>
          <p className="sub">Open the link from your email, or ask for a new one.</p>
          <Link to="/forgot-password" className="btn btn-ink w-100">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <p className="eyebrow">Staff only</p>
        <h1>Choose a new password</h1>
        <p className="sub">At least 8 characters. You will be logged out everywhere else.</p>
        <ErrorMessage
          message={
            error && !['new_password', 'confirm'].includes(error.field) ? error.message : null
          }
        />
        <FormField
          id="password"
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={change}
          error={fieldError('new_password')}
          required
        />
        <FormField
          id="confirm"
          name="confirm"
          label="Repeat the new password"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={change}
          error={fieldError('confirm')}
          required
        />
        <button type="submit" className="btn btn-brand w-100" disabled={busy}>
          {busy ? 'Saving…' : 'Set new password'}
        </button>
        <p className="mt-3 mb-0 text-center">
          <Link to="/forgot-password">Link expired? Request a new one</Link>
        </p>
      </form>
    </div>
  );
}
