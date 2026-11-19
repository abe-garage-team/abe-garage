import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authService from '../../../services/auth.service.js';
import FormField from '../../../components/common/FormField.jsx';
import ErrorMessage from '../../../components/common/ErrorMessage.jsx';

// BE-005. The server answers 200 whether or not the email exists, so the page says the same
// thing either way and never reveals which emails are registered.
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <p className="eyebrow">Staff only</p>
        <h1>Forgot your password?</h1>
        {sent ? (
          <>
            <p className="alert alert-success" role="status">
              If that email belongs to a staff account, a reset link is on its way. It works for 15
              minutes.
            </p>
            <Link to="/login" className="btn btn-ink w-100">
              Back to login
            </Link>
          </>
        ) : (
          <>
            <p className="sub">Enter your work email and we will send you a reset link.</p>
            <ErrorMessage message={error && !error.field ? error.message : null} />
            <FormField
              id="email"
              name="email"
              label="Email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={error?.field === 'email' ? error.message : undefined}
              required
            />
            <button type="submit" className="btn btn-brand w-100" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
            <p className="mt-3 mb-0 text-center">
              <Link to="/login">Back to login</Link>
            </p>
          </>
        )}
      </form>
    </div>
  );
}
