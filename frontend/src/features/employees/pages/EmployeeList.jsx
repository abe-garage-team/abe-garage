import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchEmployees } from '../../../services/employee.service.js';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js';
import { useRoles } from '../../../hooks/useRoles.js';
import { formatDateTime } from '../../../utils/format-date.js';
import SearchBox from '../../../components/common/SearchBox.jsx';
import Pagination from '../../../components/common/Pagination.jsx';
import { ActiveBadge } from '../../../components/common/StatusBadge.jsx';
import LoadingState from '../../../components/common/LoadingState.jsx';
import ErrorMessage from '../../../components/common/ErrorMessage.jsx';

const LIMIT = 10;

// BE-010. Search, role and active filters, pagination. Admin only (the route guard enforces it).
export default function EmployeeList() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [roleId, setRoleId] = useState('');
  const [active, setActive] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ employees: [], pagination: { total: 0, total_pages: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const roles = useRoles();
  const notice = useLocation().state?.message;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchEmployees({ search: debouncedSearch, role_id: roleId, active, page, limit: LIMIT })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, roleId, active, page]);

  // Any new filter starts again from page 1.
  const filter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const { employees, pagination } = result;
  return (
    <>
      <div className="card-title-row">
        <h1 className="page-title mb-0">Employees</h1>
        <Link to="/admin/employee/new" className="btn btn-brand">
          Add employee
        </Link>
      </div>
      {notice && (
        <p className="alert alert-success" role="status">
          {notice}
        </p>
      )}
      <section className="ag-card">
        <div className="row g-2 mb-3">
          <div className="col-md-6">
            <SearchBox
              value={search}
              onChange={filter(setSearch)}
              label="Search employees"
              placeholder="Search by name or email"
            />
          </div>
          <div className="col-md-3">
            <label className="visually-hidden" htmlFor="filter-role">
              Role
            </label>
            <select
              id="filter-role"
              className="form-select"
              value={roleId}
              onChange={(event) => filter(setRoleId)(event.target.value)}
            >
              <option value="">All roles</option>
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="visually-hidden" htmlFor="filter-active">
              Status
            </label>
            <select
              id="filter-active"
              className="form-select"
              value={active}
              onChange={(event) => filter(setActive)(event.target.value)}
            >
              <option value="">Active and inactive</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
          </div>
        </div>

        <ErrorMessage message={error} />
        {loading ? (
          <LoadingState message="Loading employees…" />
        ) : employees.length === 0 ? (
          <p className="muted mb-0">No employees match.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th className="text-end">Edit</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.employee_id}>
                    <td>
                      {e.first_name} {e.last_name}
                    </td>
                    <td>{e.email}</td>
                    <td>{e.phone}</td>
                    <td>{e.role_name}</td>
                    <td>
                      <ActiveBadge active={e.active} />
                    </td>
                    <td className="muted">{formatDateTime(e.created_at)}</td>
                    <td className="text-end">
                      <Link
                        to={`/admin/employee/${e.employee_id}/edit`}
                        className="btn btn-sm btn-ink"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span className="muted">{pagination.total} employee(s)</span>
          <Pagination page={page} totalPages={pagination.total_pages} onPageChange={setPage} />
        </div>
      </section>
    </>
  );
}
