import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCustomers } from '../../../../services/customer.service.js';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue.js';
import ErrorMessage from '../../../../components/common/ErrorMessage.jsx';
import Pagination from '../../../../components/common/Pagination.jsx';
import SearchBox from '../../../../components/common/SearchBox.jsx';
import { ActiveBadge } from '../../../../components/common/StatusBadge.jsx';

const PAGE_SIZE = 10;

export default function CustomerStep({ onSelect }) {
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(term, 300).trim();

  const [customers, setCustomers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!search) {
      setCustomers([]);
      setTotalPages(1);
      setError('');
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    fetchCustomers({ search, page, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setCustomers(data?.customers ?? []);
        setTotalPages(data?.pagination?.total_pages ?? 1);
      })
      .catch((err) => {
        if (cancelled) return;
        setCustomers([]);
        setError(err.message || 'Could not search customers. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, page]);

  function handleChange(value) {
    setTerm(value);
    setPage(1);
  }

  return (
    <section aria-labelledby="customer-step-title">
      <h2 id="customer-step-title" className="visually-hidden">
        Find the customer
      </h2>
      <SearchBox
        value={term}
        onChange={handleChange}
        label="Search customers"
        placeholder="Search for a customer using first name, last name, email address or phone number"
      />
      <Link to="/admin/customer/new" className="btn btn-brand mt-3">
        Add new customer
      </Link>

      <ErrorMessage message={error} />

      {search && (
        <div className="ag-card ord-results" aria-live="polite">
          {loading && <p className="ord-empty">Searching…</p>}
          {!loading && !error && customers.length === 0 && (
            <p className="ord-empty">
              No customer matches “{search}”. Check the spelling, or add a new customer.
            </p>
          )}
          {!loading && customers.length > 0 && (
            <div className="table-responsive">
              <table className="table align-middle ord-table">
                <caption className="visually-hidden">Customers matching your search</caption>
                <thead>
                  <tr>
                    <th scope="col">First name</th>
                    <th scope="col">Last name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Phone</th>
                    <th scope="col" className="text-end">
                      Choose
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.customer_id}>
                      <td>{customer.first_name}</td>
                      <td>{customer.last_name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone}</td>
                      <td className="text-end">
                        {customer.active ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-ink"
                            onClick={() => onSelect(customer)}
                            aria-label={`Choose ${customer.first_name} ${customer.last_name}`}
                          >
                            Select
                          </button>
                        ) : (
                          <ActiveBadge active={false} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </section>
  );
}
