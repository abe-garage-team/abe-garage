import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchVehicleById, fetchVehicleServiceHistory } from '../../../services/vehicle.service.js';

// Map numeric order statuses to labels and badge classes
const orderStatusMap = {
  1: { label: 'Awaiting approval', badgeClass: 'bg-warning text-dark' },
  2: { label: 'Approved', badgeClass: 'bg-primary text-white' },
  3: { label: 'In progress', badgeClass: 'bg-info text-dark' },
  4: { label: 'Completed', badgeClass: 'bg-success text-white' },
  5: { label: 'Declined', badgeClass: 'bg-danger text-white' },
};

// Format ISO date strings into MM/DD/YYYY format
function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

export default function VehicleDetails() {
  const { vehicle_id, id } = useParams();
  const currentVehicleId = vehicle_id || id;

  const [vehicle, setVehicle] = useState(null);
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch vehicle specifications and past service history
  const loadVehicleAndHistory = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [vehicleData, historyData] = await Promise.all([
        fetchVehicleById(currentVehicleId),
        fetchVehicleServiceHistory(currentVehicleId, { page, limit: 10 }),
      ]);

      setVehicle(vehicleData);
      setOrders(historyData?.orders || (Array.isArray(historyData) ? historyData : []));
      setTotalPages(historyData?.pagination?.total_pages || 1);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load vehicle details or service history.');
    } finally {
      setIsLoading(false);
    }
  }, [currentVehicleId, page]);

  useEffect(() => {
    if (currentVehicleId) {
      loadVehicleAndHistory();
    }
  }, [currentVehicleId, loadVehicleAndHistory]);

  if (isLoading && !vehicle) {
    return (
      <div className="container-fluid p-0">
        <div className="text-center py-5 text-muted">
          <div className="spinner-border spinner-border-sm me-2" role="status" />
          Loading vehicle specifications…
        </div>
      </div>
    );
  }

  if (errorMessage && !vehicle) {
    return (
      <div className="container-fluid p-0">
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
        <Link to="/admin/customers" className="btn btn-outline-secondary">
          ← Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      {/* Header and Back Link */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center">
          <h2 className="fw-bold mb-0" style={{ color: '#0d1b42' }}>
            {vehicle?.year} {vehicle?.make} {vehicle?.model}
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

        {vehicle?.customer_id && (
          <Link
            to={`/admin/customer/${vehicle.customer_id}`}
            className="btn btn-outline-secondary btn-sm"
          >
            ← Back to Customer Profile
          </Link>
        )}
      </div>

      {/* Vehicle Specifications Card */}
      <div className="card shadow-sm border-0 mb-4" style={{ maxWidth: '1000px' }}>
        <div className="card-header bg-white py-3 border-bottom">
          <h5 className="fw-bold mb-0" style={{ color: '#0d1b42' }}>
            Vehicle Specifications
          </h5>
        </div>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-12 col-md-3">
              <span className="text-muted d-block small">License Plate</span>
              <span className="badge bg-light text-dark border fs-6 mt-1">
                {vehicle?.plate || '—'}
              </span>
            </div>
            <div className="col-12 col-md-3">
              <span className="text-muted d-block small">Odometer Mileage</span>
              <strong className="fs-6 text-dark mt-1 d-block">
                {vehicle?.mileage != null
                  ? `${Number(vehicle.mileage).toLocaleString()} mi`
                  : '—'}
              </strong>
            </div>
            <div className="col-12 col-md-3">
              <span className="text-muted d-block small">Body Type</span>
              <strong className="fs-6 text-dark mt-1 d-block">{vehicle?.type || '—'}</strong>
            </div>
            <div className="col-12 col-md-3">
              <span className="text-muted d-block small">Color</span>
              <strong className="fs-6 text-dark mt-1 d-block">{vehicle?.color || '—'}</strong>
            </div>
            <div className="col-12 col-md-6">
              <span className="text-muted d-block small">VIN / Serial Number</span>
              <span className="font-monospace text-secondary">{vehicle?.vin || 'N/A'}</span>
            </div>
            <div className="col-12 col-md-6">
              <span className="text-muted d-block small">Registered Owner</span>
              <Link
                to={`/admin/customer/${vehicle?.customer_id}`}
                className="text-decoration-none fw-semibold"
                style={{ color: '#df251c' }}
              >
                View Customer Profile →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Service History Section */}
      <div className="mb-4" style={{ maxWidth: '1000px' }}>
        <h4 className="fw-bold mb-3" style={{ color: '#0d1b42' }}>
          Service & Repair History
        </h4>

        {orders.length === 0 ? (
          <div className="card shadow-sm border-0 p-4 text-muted bg-white">
            No past repair orders or service history recorded for this vehicle.
          </div>
        ) : (
          <div className="card shadow-sm border-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr style={{ fontSize: '0.88rem', color: '#17213d' }}>
                    <th scope="col" className="ps-3">
                      Order #
                    </th>
                    <th scope="col">Date</th>
                    <th scope="col">Status</th>
                    <th scope="col">Services Performed</th>
                    <th scope="col">Total</th>
                    <th scope="col">Payment</th>
                    <th scope="col" className="text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const statusMeta = orderStatusMap[order.status] || {
                      label: order.status_name || 'Unknown',
                      badgeClass: 'bg-secondary text-white',
                    };
                    const jobs = order.jobs || [];

                    return (
                      <tr key={order.order_id} style={{ fontSize: '0.9rem' }}>
                        <td className="ps-3 fw-semibold">#{order.order_id}</td>
                        <td className="text-muted">{formatDate(order.created_at)}</td>
                        <td>
                          <span className={`badge ${statusMeta.badgeClass}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td>
                          {jobs.length > 0 ? (
                            <ul className="list-unstyled mb-0 small">
                              {jobs.map((job, idx) => (
                                <li key={idx} className="text-secondary">
                                  • {job.service_name}{' '}
                                  <span className="text-muted">
                                    (${parseFloat(job.line_price || 0).toFixed(2)})
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-muted small">Standard service</span>
                          )}
                        </td>
                        <td className="fw-semibold">
                          {parseFloat(order.total || 0).toFixed(2)} {order.currency || 'ETB'}
                        </td>
                        <td>
                          <span
                            className={`badge ${order.paid ? 'bg-success text-white' : 'bg-warning text-dark'}`}
                          >
                            {order.paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="text-center">
                          <Link
                            to={`/admin/order/${order.order_id}`}
                            className="btn btn-sm btn-outline-secondary"
                            title="View Order Details"
                          >
                            View Order
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-end mt-3">
            <div className="btn-group shadow-sm" role="group" aria-label="Pagination">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage(1)}
              >
                « First
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                ‹ Previous
              </button>
              <button
                type="button"
                className="btn text-white"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                style={{ backgroundColor: '#17213d' }}
              >
                › Next
              </button>
              <button
                type="button"
                className="btn text-white"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage(totalPages)}
                style={{ backgroundColor: '#0d1b42' }}
              >
                » Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}