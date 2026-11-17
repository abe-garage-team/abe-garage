import { useCallback, useEffect, useState } from 'react';
import {
  createService,
  fetchServices,
  updateService,
} from '../../../services/catalog.service.js';

export default function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // New service state
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    labor_hours: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit service state
  const [editingService, setEditingService] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch catalog services
  const loadServices = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await fetchServices({ limit: 50 });
      const list = data?.services || (Array.isArray(data) ? data : []);
      setServices(list);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load services catalog.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Handle new service input changes
  function handleNewChange(e) {
    const { name, value } = e.target;
    setNewService((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Handle creating a new service
  async function handleCreateService(e) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newService.name.trim() || !newService.description.trim()) {
      setErrorMessage('Please provide both service name and description.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createService({
        name: newService.name.trim(),
        description: newService.description.trim(),
        price: newService.price ? parseFloat(newService.price).toFixed(2) : '50.00',
        labor_hours: newService.labor_hours
          ? parseFloat(newService.labor_hours).toFixed(2)
          : '0.50',
        active: true,
      });

      setSuccessMessage('Service added successfully to catalog!');
      setNewService({
        name: '',
        description: '',
        price: '',
        labor_hours: '',
      });
      loadServices();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create service.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Open edit modal for selected service
  function handleEditClick(service) {
    setEditingService({
      ...service,
      price: service.price || '',
      labor_hours: service.labor_hours || '',
    });
  }

  // Handle changes in edit modal
  function handleEditChange(e) {
    const { name, value, type, checked } = e.target;
    setEditingService((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  // Save updated service details
  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingService) return;

    setIsUpdating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await updateService(editingService.service_id, {
        name: editingService.name.trim(),
        description: editingService.description.trim(),
        price: editingService.price ? parseFloat(editingService.price).toFixed(2) : undefined,
        labor_hours: editingService.labor_hours
          ? parseFloat(editingService.labor_hours).toFixed(2)
          : undefined,
        active: Boolean(editingService.active),
      });

      setSuccessMessage(`Service "${editingService.name}" updated successfully.`);
      setEditingService(null);
      loadServices();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update service.');
    } finally {
      setIsUpdating(false);
    }
  }

  // Soft-deactivate a service entry
  async function handleDeactivate(service) {
    const confirmDeactivate = window.confirm(
      `Are you sure you want to deactivate "${service.name}"?`,
    );
    if (!confirmDeactivate) return;

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await updateService(service.service_id, { active: false });
      setSuccessMessage(`Service "${service.name}" deactivated.`);
      loadServices();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to deactivate service.');
    }
  }

  return (
    <div className="container-fluid p-0" style={{ maxWidth: '1000px' }}>
      {/* Page Title with red accent line */}
      <div className="mb-2 d-flex align-items-center">
        <h2 className="fw-bold mb-0" style={{ color: '#0d1b42' }}>
          Services we provide
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

      {/* Subtitle description */}
      <p className="text-muted mb-4" style={{ fontSize: '0.92rem', lineHeight: '1.6' }}>
        Manage garage maintenance and repair service offerings, pricing, and labor estimates.
      </p>

      {/* Status Alerts */}
      {errorMessage && (
        <div className="alert alert-danger mb-4" role="alert">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success mb-4" role="alert">
          {successMessage}
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="card shadow border-0 mb-4">
          <div className="card-header bg-light py-3 d-flex justify-content-between align-items-center">
            <h5 className="fw-bold mb-0" style={{ color: '#0d1b42' }}>
              Edit Service: {editingService.name}
            </h5>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setEditingService(null)}
            >
              Cancel
            </button>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleSaveEdit}>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Service Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={editingService.name}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Service Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="3"
                  value={editingService.description}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold small">Price (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    className="form-control"
                    value={editingService.price}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold small">Labor Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    name="labor_hours"
                    className="form-control"
                    value={editingService.labor_hours}
                    onChange={handleEditChange}
                  />
                </div>
              </div>
              <div className="form-check mb-4">
                <input
                  type="checkbox"
                  name="active"
                  id="editServiceActive"
                  className="form-check-input"
                  checked={Boolean(editingService.active)}
                  onChange={handleEditChange}
                />
                <label htmlFor="editServiceActive" className="form-check-label ms-1">
                  Active in Catalog
                </label>
              </div>
              <button
                type="submit"
                className="btn text-white fw-bold px-4 py-2"
                disabled={isUpdating}
                style={{ backgroundColor: '#df251c', border: 'none', borderRadius: '2px' }}
              >
                {isUpdating ? 'SAVING…' : 'SAVE CHANGES'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Services List Cards */}
      <div className="mb-5">
        {isLoading ? (
          <div className="card shadow-sm border-0 p-5 text-center text-muted">
            <div className="spinner-border spinner-border-sm me-2" role="status" />
            Loading services…
          </div>
        ) : services.length === 0 ? (
          <div className="card shadow-sm border-0 p-4 text-center text-muted">
            No services found in catalog.
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.service_id}
              className="card shadow-sm border-0 mb-3 px-4 py-3"
              style={{ backgroundColor: '#ffffff' }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="pe-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h5 className="fw-bold mb-0" style={{ color: '#0d1b42', fontSize: '1.05rem' }}>
                      {service.name}
                    </h5>
                    {!service.active && (
                      <span className="badge bg-secondary-subtle text-secondary border small">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-secondary mb-0 small" style={{ lineHeight: '1.5' }}>
                    {service.description}
                  </p>
                </div>

                {/* Edit and Deactivate Actions */}
                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleEditClick(service)}
                    title="Edit Service"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDeactivate(service)}
                    title="Deactivate Service"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add a New Service Section */}
      <div className="card shadow-sm border-0 mb-4 p-4" style={{ backgroundColor: '#ffffff' }}>
        <div className="mb-4 d-flex align-items-center">
          <h4 className="fw-bold mb-0" style={{ color: '#0d1b42' }}>
            Add a new service
          </h4>
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

        <form onSubmit={handleCreateService} noValidate>
          <div className="mb-3">
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="Service name"
              value={newService.name}
              onChange={handleNewChange}
              disabled={isSubmitting}
              required
              style={{ minHeight: '48px', fontSize: '0.95rem' }}
            />
          </div>

          <div className="mb-3">
            <textarea
              name="description"
              className="form-control"
              placeholder="Service description"
              rows="4"
              value={newService.description}
              onChange={handleNewChange}
              disabled={isSubmitting}
              required
              style={{ fontSize: '0.95rem' }}
            />
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <input
                type="number"
                step="0.01"
                name="price"
                className="form-control"
                placeholder="Price (ETB, e.g. 50.00)"
                value={newService.price}
                onChange={handleNewChange}
                disabled={isSubmitting}
                style={{ minHeight: '46px', fontSize: '0.95rem' }}
              />
            </div>
            <div className="col-12 col-md-6">
              <input
                type="number"
                step="0.1"
                name="labor_hours"
                className="form-control"
                placeholder="Estimated labor hours (e.g. 0.5)"
                value={newService.labor_hours}
                onChange={handleNewChange}
                disabled={isSubmitting}
                style={{ minHeight: '46px', fontSize: '0.95rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn text-white fw-bold px-4 py-2"
            disabled={isSubmitting}
            style={{
              backgroundColor: '#df251c',
              border: 'none',
              borderRadius: '2px',
              fontSize: '0.9rem',
              letterSpacing: '0.5px',
              minHeight: '46px',
            }}
          >
            {isSubmitting ? 'ADDING SERVICE…' : 'ADD SERVICE'}
          </button>
        </form>
      </div>
    </div>
  );
}