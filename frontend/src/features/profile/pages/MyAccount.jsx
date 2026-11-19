import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { ROLE_NAMES } from '../../../constants/roles.js';
import * as authService from '../../../services/auth.service.js';
import FormField from '../../../components/common/FormField.jsx';
import ErrorMessage from '../../../components/common/ErrorMessage.jsx';

// BE-008 shows the logged-in employee; BE-007 changes their password.
// Staff cannot edit their own name, email or role here: an Admin does that on the employee page.
export default function MyAccount() {
  const { employee, clearSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    if (form.next !== form.confirm) {
      setError({ field: 'confirm', message: 'The two new passwords do not match' });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await authService.changePassword(form.current, form.next);
      // The server has ended every session, including this one.
      clearSession();
      navigate('/login', {
        replace: true,
        state: { message: 'Your password was changed. Log in again with the new one.' },
      });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (name) => (error?.field === name ? error.message : undefined);

  return (
    <>
      <h1 className="page-title">My account</h1>
      <div className="page-narrow">
        <section className="ag-card">
          <div className="card-title-row">
            <h2>Profile</h2>
          </div>
          <dl className="kv">
            <div>
              <dt>Name</dt>
              <dd>
                {employee.first_name} {employee.last_name}
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{employee.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{employee.phone || '–'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{ROLE_NAMES[employee.role_id]}</dd>
            </div>
          </dl>
          <p className="muted mt-3 mb-0">
            To change your name, email or phone, ask an Admin to edit your employee record.
          </p>
        </section>

        <form className="ag-card" onSubmit={submit} noValidate>
          <div className="card-title-row">
            <h2>Change password</h2>
          </div>
          <p className="muted">
            At least 8 characters. After the change you will be logged out on every device and asked
            to log in again.
          </p>
          <ErrorMessage
            message={
              error && !['current_password', 'new_password', 'confirm'].includes(error.field)
                ? error.message
                : null
            }
          />
          <FormField
            id="current"
            name="current"
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={form.current}
            onChange={change}
            error={fieldError('current_password')}
            required
          />
          <FormField
            id="next"
            name="next"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={form.next}
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
          <button type="submit" className="btn btn-brand" disabled={busy}>
            {busy ? 'Saving…' : 'Change password'}
          </button>
        </form>
      </div>
    </>
  );
}
