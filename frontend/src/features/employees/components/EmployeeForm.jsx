import { useState } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../../../components/common/FormField.jsx';
import ErrorMessage from '../../../components/common/ErrorMessage.jsx';
import { useRoles } from '../../../hooks/useRoles.js';

export const EMPTY_EMPLOYEE = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role_id: '',
  password: '',
  active: true,
};

// One form for Add (with a password field) and Edit (without). The page owns the submit:
// it receives the values and decides what to send to the API.
export default function EmployeeForm({ initial, mode, busy, error, onSubmit }) {
  const [form, setForm] = useState(initial);
  const roles = useRoles();

  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };
  const fieldError = (name) => (error?.field === name ? error.message : undefined);
  const knownFields = Object.keys(EMPTY_EMPLOYEE);

  return (
    <form
      className="ag-card page-narrow"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ ...form, role_id: Number(form.role_id) });
      }}
    >
      <ErrorMessage message={error && !knownFields.includes(error.field) ? error.message : null} />
      <div className="row">
        <div className="col-md-6">
          <FormField
            id="first_name"
            name="first_name"
            label="First name"
            value={form.first_name}
            onChange={change}
            error={fieldError('first_name')}
            required
          />
        </div>
        <div className="col-md-6">
          <FormField
            id="last_name"
            name="last_name"
            label="Last name"
            value={form.last_name}
            onChange={change}
            error={fieldError('last_name')}
            required
          />
        </div>
      </div>
      <FormField
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="off"
        value={form.email}
        onChange={change}
        error={fieldError('email')}
        required
      />
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
      <FormField
        id="role_id"
        name="role_id"
        label="Role"
        as="select"
        value={form.role_id}
        onChange={change}
        error={fieldError('role_id')}
        required
      >
        <option value="">Choose a role</option>
        {roles.map((role) => (
          <option key={role.role_id} value={role.role_id}>
            {role.role_name}
          </option>
        ))}
      </FormField>
      {mode === 'add' && (
        <FormField
          id="password"
          name="password"
          label="Initial password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={change}
          error={fieldError('password')}
          required
        />
      )}
      <div className="form-check mb-4">
        <input
          className="form-check-input"
          type="checkbox"
          id="active"
          name="active"
          checked={form.active}
          onChange={change}
        />
        <label className="form-check-label" htmlFor="active">
          Active employee
          {mode === 'edit' && (
            <span className="muted">
              {' '}
              — inactive staff cannot log in and are logged out at once
            </span>
          )}
        </label>
      </div>
      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-brand" disabled={busy}>
          {busy ? 'Saving…' : mode === 'add' ? 'Add employee' : 'Save changes'}
        </button>
        <Link to="/admin/employees" className="btn btn-outline-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
