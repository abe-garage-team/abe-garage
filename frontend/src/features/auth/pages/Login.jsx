import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { ROLES } from '../../../constants/roles.js';
import * as authService from '../../../services/auth.service.js';
import FormField from '../../../components/common/FormField.jsx';
import ErrorMessage from '../../../components/common/ErrorMessage.jsx';

// BE-004. On success the browser holds the session cookie; we only keep the profile.
export default function Login() {
  const { isAuthenticated, checking, setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!checking && isAuthenticated) return <Navigate to="/admin" replace />;

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const employee = await authService.login(form.email.trim(), form.password);
      setSession(employee);
      const home = employee.role_id === ROLES.TECHNICIAN ? '/admin/my-jobs' : '/admin';
      navigate(location.state?.from || home, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (name) => (error?.field === name ? error.message : undefined);

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <p className="eyebrow">Staff only</p>
        <h1>Login to your account</h1>
        <p className="sub">Use the email your admin set up for you.</p>
        {location.state?.message && (
          <p className="alert alert-info" role="status">
            {location.state.message}
          </p>
        )}
        <ErrorMessage message={error && !error.field ? error.message : null} />
        <FormField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="username"
          value={form.email}
          onChange={change}
          error={fieldError('email')}
          required
        />
        <FormField
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={change}
          error={fieldError('password')}
          required
        />
        <button type="submit" className="btn btn-brand w-100" disabled={busy}>
          {busy ? 'Signing in…' : 'Login'}
        </button>
        <p className="mt-3 mb-0 text-center">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
      </form>
    </div>
  );
}
