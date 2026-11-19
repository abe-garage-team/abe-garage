import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEmployee } from '../../../services/employee.service.js';
import EmployeeForm, { EMPTY_EMPLOYEE } from '../components/EmployeeForm.jsx';

// BE-009. A duplicate email comes back as 409 EMAIL_IN_USE and is shown under the email field.
export default function AddEmployee() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(values) {
    setBusy(true);
    setError(null);
    try {
      await createEmployee(values);
      navigate('/admin/employees', { state: { message: `${values.first_name} was added.` } });
    } catch (err) {
      if (err.code === 'EMAIL_IN_USE') err.field = 'email';
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="page-title">Add a new employee</h1>
      <EmployeeForm
        initial={EMPTY_EMPLOYEE}
        mode="add"
        busy={busy}
        error={error}
        onSubmit={submit}
      />
    </>
  );
}
