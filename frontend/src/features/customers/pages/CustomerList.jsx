import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCustomers } from '../../../services/customer.service.js';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js';

// Format ISO timestamp into MM - DD - YYYY | HH:mm format matching design mockup
function formatAddedDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month} - ${day} - ${year} | ${hours}:${minutes}`;
}

export default function CustomerList() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch customers whenever debounced search term or current page changes
  useEffect(() => {
    let isCancelled = false;

    async function loadCustomers() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await fetchCustomers({
          search: debouncedSearch,
          page,
          limit: 10,
        });

        if (!isCancelled) {
          const list = data?.customers || (Array.isArray(data) ? data : []);
          setCustomers(list);
          setTotalPages(data?.pagination?.total_pages || 1);
        }
      } catch (err) {
        if (!isCancelled) {
          setErrorMessage(err.message || 'Failed to load customers. Please try again.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, page]);

  // Reset page to 1 when user types a new search query
  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
    setPage(1);
  }

  return (
    <div className="container-fluid p-0">
      {/* Title with red accent underline bar */}
      <div className="mb-4 d-flex align-items-center">
        <h2 className="fw-bold mb-0" style={{ color: '#0d1b42' }}>
          Customers
        </h2>
        <span
          style={{
            display: 'inline-block',
            width: '42px',
            height: '4px',
            backgroundColor: '#df251c',
            marginLeft: '12px',
            borderRadius: '2px',
          }}
        />
      </div>

      {/* Full-width Search Input with magnifying glass icon */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-2 position-relative">
          <input
            type="search"
            className="form-control border-0 shadow-none ps-3 pe-5"
            placeholder="Search for a customer using first name, last name, email address of phone number"
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ fontSize: '0.95rem' }}
            aria-label="Search customers"
          />
          <span
            className="position-absolute end-0 top-50 translate-middle-y pe-3 text-muted"
            style={{ pointerEvents: 'none' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
            </svg>
          </span>
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Table container */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr style={{ fontSize: '0.9rem', color: '#17213d' }}>
                <th scope="col" className="ps-4">
                  ID
                </th>
                <th scope="col">First Name</th>
                <th scope="col">Last Name</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Added Date</th>
                <th scope="col">Active</th>
                <th scope="col" className="text-center">
                  Edit
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Loading customers…
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.customer_id} style={{ fontSize: '0.92rem' }}>
                    <td className="ps-4 fw-semibold text-muted">{customer.customer_id}</td>
                    <td className="fw-semibold text-dark">{customer.first_name}</td>
                    <td>{customer.last_name}</td>
                    <td className="text-muted">{customer.email}</td>
                    <td className="text-muted">{customer.phone}</td>
                    <td className="text-muted">{formatAddedDate(customer.created_at)}</td>
                    <td>
                      <span className={customer.active ? 'text-success fw-semibold' : 'text-muted'}>
                        {customer.active ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-inline-flex gap-2">
                        {/* Edit Customer Link */}
                        <Link
                          to={`/admin/customer/${customer.customer_id}/edit`}
                          className="btn btn-sm btn-light border p-1"
                          title="Edit Customer"
                          aria-label={`Edit ${customer.first_name} ${customer.last_name}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                            <path
                              fillRule="evenodd"
                              d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"
                            />
                          </svg>
                        </Link>

                        {/* Customer 3-Node Profile Link */}
                        <Link
                          to={`/admin/customer/${customer.customer_id}`}
                          className="btn btn-sm btn-light border p-1"
                          title="View Customer Profile"
                          aria-label={`View profile of ${customer.first_name} ${customer.last_name}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"
                            />
                            <path
                              fillRule="evenodd"
                              d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"
                            />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls matching the design mockup: « First, ‹ Previous, › Next, » Last */}
      <div className="d-flex justify-content-center justify-content-md-end mb-4">
        <div className="btn-group shadow-sm" role="group" aria-label="Pagination">
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage(1)}
            style={{ minHeight: '38px', minWidth: '80px' }}
          >
            « First
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            style={{ minHeight: '38px', minWidth: '95px' }}
          >
            ‹ Previous
          </button>
          <button
            type="button"
            className="btn text-white"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            style={{
              backgroundColor: page >= totalPages ? '#6c757d' : '#17213d',
              borderColor: '#17213d',
              minHeight: '38px',
              minWidth: '85px',
            }}
          >
            › Next
          </button>
          <button
            type="button"
            className="btn text-white"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage(totalPages)}
            style={{
              backgroundColor: page >= totalPages ? '#6c757d' : '#0d1b42',
              borderColor: '#0d1b42',
              minHeight: '38px',
              minWidth: '80px',
            }}
          >
            » Last
          </button>
        </div>
      </div>
    </div>
  );
}
