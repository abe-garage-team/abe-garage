import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchCustomerById } from '../../../services/customer.service.js';
import AddVehicleModal from '../../vehicles/components/AddVehicleModal.jsx';

// Map numeric order statuses to descriptive labels and badge colors
const orderStatusMap = {
  1: { label: 'Awaiting approval', badgeClass: 'bg-warning text-dark' },
  2: { label: 'Approved', badgeClass: 'bg-primary text-white' },
  3: { label: 'In progress', badgeClass: 'bg-info text-dark' },
  4: { label: 'Completed', badgeClass: 'bg-success text-white' },
  5: { label: 'Declined', badgeClass: 'bg-danger text-white' },
};

// Format ISO date string into readable MM/DD/YYYY format
function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

export default function CustomerProfile() {
  const { customer_id } = useParams();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  // Fetch full customer aggregation profile
  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await fetchCustomerById(customer_id);
      setProfile(data);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load customer profile.');
    } finally {
      setIsLoading(false);
    }
  }, [customer_id]);

  useEffect(() => {
    if (customer_id) {
      loadProfile();
    }
  }, [customer_id, loadProfile]);

  if (isLoading) {
    return (
      <div className="container-fluid p-0">
        <div className="text-center py-5 text-muted">
          <div className="spinner-border spinner-border-sm me-2" role="status" />
          Loading customer profile…
        </div>
      </div>
    );
  }

  if (errorMessage || !profile) {
    return (
      <div className="container-fluid p-0">
        <div className="alert alert-danger" role="alert">
          {errorMessage || 'Customer profile not found.'}
        </div>
        <Link to="/admin/customers" className="btn btn-outline-secondary">
          ← Back to Customers
        </Link>
      </div>
    );
  }

  const vehicles = profile.vehicles || [];
  const recentOrders = profile.recent_orders || [];
  const unpaidTotal = parseFloat(profile.unpaid_total || 0);

  return (
    <div className="container-fluid p-0">
      {/* 3-Node Stepped Vertical Timeline Container */}
      <div className="position-relative" style={{ maxWidth: '1000px' }}>
        {/* Continuous vertical timeline connector line */}
        <div
          style={{
            position: 'absolute',
            top: '36px',
            bottom: '40px',
            left: '35px',
            width: '2px',
            backgroundColor: '#dde1e9',
            zIndex: 1,
          }}
        />

        {/* ================= Node 1: Customer Info ================= */}
        <div className="d-flex align-items-start mb-5 position-relative" style={{ zIndex: 2 }}>
          {/* Node 1 Circular Badge */}
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm me-4 flex-shrink-0"
            style={{
              width: '72px',
              height: '72px',
              backgroundColor: '#df251c',
              fontSize: '1.05rem',
            }}
          >
            Info
          </div>

          {/* Node 1 Content Card */}
          <div className="flex-grow-1 pt-1">
            <h3 className="fw-bold mb-3" style={{ color: '#0d1b42' }}>
              Customer: {profile.first_name} {profile.last_name}
            </h3>
            <div className="text-secondary" style={{ fontSize: '0.98rem', lineHeight: '1.9' }}>
              <div>
                <strong style={{ color: '#0d1b42' }}>Email:</strong> {profile.email}
              </div>
              <div>
                <strong style={{ color: '#0d1b42' }}>Phone Number:</strong> {profile.phone}
              </div>
              <div>
                <strong style={{ color: '#0d1b42' }}>Active Customer:</strong>{' '}
                {profile.active ? 'Yes' : 'No'}
              </div>
              <div className="d-flex align-items-center mt-1">
                <strong style={{ color: '#0d1b42' }}>Edit customer info:</strong>
                <Link
                  to={`/admin/customer/${profile.customer_id}/edit`}
                  className="ms-2 text-decoration-none"
                  title="Edit customer info"
                  aria-label="Edit customer info"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="#df251c"
                    viewBox="0 0 16 16"
                  >
                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                    <path
                      fillRule="evenodd"
                      d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ================= Node 2: Vehicles ("Cars") ================= */}
        <div className="d-flex align-items-start mb-5 position-relative" style={{ zIndex: 2 }}>
          {/* Node 2 Circular Badge */}
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm me-4 flex-shrink-0"
            style={{
              width: '72px',
              height: '72px',
              backgroundColor: '#df251c',
              fontSize: '1.05rem',
            }}
          >
            Cars
          </div>

          {/* Node 2 Content */}
          <div className="flex-grow-1 pt-1">
            <h4 className="fw-bold mb-3" style={{ color: '#0d1b42' }}>
              Vehicles of {profile.first_name}
            </h4>

            {vehicles.length === 0 ? (
              <div
                className="card shadow-sm border-0 p-3 mb-3 text-muted"
                style={{ backgroundColor: '#ffffff' }}
              >
                No vehicle found
              </div>
            ) : (
              <div className="card shadow-sm border-0 mb-3">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr style={{ fontSize: '0.88rem', color: '#17213d' }}>
                        <th scope="col" className="ps-3">
                          Year
                        </th>
                        <th scope="col">Make</th>
                        <th scope="col">Model</th>
                        <th scope="col">Type</th>
                        <th scope="col">Mileage</th>
                        <th scope="col">Plate</th>
                        <th scope="col">Color</th>
                        <th scope="col" className="text-center">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.map((v) => (
                        <tr key={v.vehicle_id} style={{ fontSize: '0.9rem' }}>
                          <td className="ps-3 fw-semibold">{v.year}</td>
                          <td>{v.make}</td>
                          <td>{v.model}</td>
                          <td>{v.type}</td>
                          <td>{Number(v.mileage).toLocaleString()} mi</td>
                          <td>
                            <span className="badge bg-light text-dark border">{v.plate}</span>
                          </td>
                          <td>{v.color}</td>
                          <td className="text-center">
                            <Link
                              to={`/admin/vehicle/${v.vehicle_id}`}
                              className="btn btn-sm btn-outline-secondary"
                              title="View Vehicle History"
                            >
                              History
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Toggle Add Vehicle Modal Button */}
            {!showAddVehicle && (
              <button
                type="button"
                className="btn text-white fw-bold px-4 py-2"
                onClick={() => setShowAddVehicle(true)}
                style={{
                  backgroundColor: '#df251c',
                  border: 'none',
                  borderRadius: '2px',
                  fontSize: '0.88rem',
                  letterSpacing: '0.5px',
                  minHeight: '44px',
                }}
              >
                ADD NEW VEHICLE
              </button>
            )}

            {/* Embedded Add Vehicle Modal / Form */}
            <AddVehicleModal
              show={showAddVehicle}
              customerId={customer_id}
              onClose={() => setShowAddVehicle(false)}
              onSuccess={() => {
                loadProfile();
                setShowAddVehicle(false);
              }}
            />
          </div>
        </div>

        {/* ================= Node 3: Orders ================= */}
        <div className="d-flex align-items-start position-relative" style={{ zIndex: 2 }}>
          {/* Node 3 Circular Badge */}
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm me-4 flex-shrink-0"
            style={{
              width: '72px',
              height: '72px',
              backgroundColor: '#df251c',
              fontSize: '1.05rem',
            }}
          >
            Orders
          </div>

          {/* Node 3 Content */}
          <div className="flex-grow-1 pt-1">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h4 className="fw-bold mb-0" style={{ color: '#0d1b42' }}>
                Orders of {profile.first_name}
              </h4>
              {recentOrders.length > 0 && unpaidTotal > 0 && (
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2">
                  Unpaid Balance: {unpaidTotal.toFixed(2)} {profile.currency || 'ETB'}
                </span>
              )}
            </div>

            {recentOrders.length === 0 ? (
              <div
                className="card shadow-sm border-0 p-3 text-muted"
                style={{ backgroundColor: '#ffffff' }}
              >
                Orders will be displayed here
              </div>
            ) : (
              <div className="card shadow-sm border-0 mb-4">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr style={{ fontSize: '0.88rem', color: '#17213d' }}>
                        <th scope="col" className="ps-3">
                          Order #
                        </th>
                        <th scope="col">Vehicle</th>
                        <th scope="col">Date</th>
                        <th scope="col">Status</th>
                        <th scope="col">Total</th>
                        <th scope="col">Payment</th>
                        <th scope="col" className="text-center">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((ord) => {
                        const statusMeta = orderStatusMap[ord.status] || {
                          label: ord.status_name || 'Unknown',
                          badgeClass: 'bg-secondary text-white',
                        };
                        return (
                          <tr key={ord.order_id} style={{ fontSize: '0.9rem' }}>
                            <td className="ps-3 fw-semibold">#{ord.order_id}</td>
                            <td>{ord.plate || `Vehicle #${ord.vehicle_id}`}</td>
                            <td className="text-muted">{formatDate(ord.created_at)}</td>
                            <td>
                              <span className={`badge ${statusMeta.badgeClass}`}>
                                {statusMeta.label}
                              </span>
                            </td>
                            <td className="fw-semibold">
                              {parseFloat(ord.total || 0).toFixed(2)} {ord.currency || 'ETB'}
                            </td>
                            <td>
                              <span
                                className={`badge ${ord.paid ? 'bg-success text-white' : 'bg-warning text-dark'}`}
                              >
                                {ord.paid ? 'Paid' : 'Unpaid'}
                              </span>
                            </td>
                            <td className="text-center">
                              <Link
                                to={`/admin/order/${ord.order_id}`}
                                className="btn btn-sm btn-outline-secondary"
                                title="View Order Details"
                              >
                                View
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
          </div>
        </div>
      </div>
    </div>
  );
}
