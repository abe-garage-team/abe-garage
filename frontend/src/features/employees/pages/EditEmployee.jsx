import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { fetchEmployee, updateEmployee } from '../../../services/employee.service.js';
import EmployeeForm from '../components/EmployeeForm.jsx';
import ConfirmDialog from '../../../components/common/ConfirmDialog.jsx';
import LoadingState from '../../../components/common/LoadingState.jsx';
import ErrorMessage from '../../../components/common/ErrorMessage.jsx';

const EDITABLE = ['first_name', 'last_name', 'email', 'phone', 'role_id', 'active'];

// BE-011 loads the record, BE-012 saves only the fields that changed.
// A role or active change logs that employee out everywhere; deactivating asks first.
// Demoting or deactivating the last active Admin is refused by the server (409 LAST_ADMIN).
export default function EditEmployee() {
  const { employee_id: id } = useParams();
  const navigate = useNavigate();
  const { employee: me } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [pending, setPending] = useState(null); // changes waiting for the deactivate confirmation
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchEmployee(id)
      .then((data) => {
        if (!cancelled) setEmployee(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function submit(values) {
    const changes = {};
    EDITABLE.forEach((field) => {
      if (values[field] !== employee[field]) changes[field] = values[field];
    });
    if (Object.keys(changes).length === 0) {
      navigate('/admin/employees');
      return;
    }
    if (changes.active === false) setPending(changes);
    else save(changes);
  }

  async function save(changes) {
    setPending(null);
    setBusy(true);
    setError(null);
    try {
      await updateEmployee(id, changes);
      const self = Number(id) === me.employee_id && ('role_id' in changes || 'active' in changes);
      // Changing my own role or status ended my session; the next request sends me to login.
      navigate(self ? '/login' : '/admin/employees', {
        state: { message: self ? 'Your account changed. Log in again.' : 'Changes saved.' },
      });
    } catch (err) {
      if (err.code === 'EMAIL_IN_USE') err.field = 'email';
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  if (loadError) return <ErrorMessage message={loadError} />;
  if (!employee) return <LoadingState message="Loading employee…" />;

  const isSelf = Number(id) === me.employee_id;
  return (
    <>
      <h1 className="page-title">
        Edit: {employee.first_name} {employee.last_name}
      </h1>
      {isSelf && (
        <p className="alert alert-info page-narrow" role="status">
          This is your own account. Changing your role or status logs you out immediately.
        </p>
      )}
      <EmployeeForm
        initial={{ ...employee, password: '' }}
        mode="edit"
        busy={busy}
        error={error}
        onSubmit={submit}
      />
      <ConfirmDialog
        open={Boolean(pending)}
        title="Deactivate this employee?"
        confirmLabel="Deactivate"
        danger
        busy={busy}
        onConfirm={() => save(pending)}
        onCancel={() => setPending(null)}
      >
        <p className="mb-0">
          {employee.first_name} will be logged out everywhere and can no longer sign in. Their
          record and history are kept; you can reactivate them later.
        </p>
      </ConfirmDialog>
    </>
  );
}
