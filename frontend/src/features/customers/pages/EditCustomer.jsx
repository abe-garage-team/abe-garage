import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCustomerById, updateCustomer } from '../../../services/customer.service.js';

export default function EditCustomer() {
  const { customer_id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    active: true,
  });

  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch initial customer data to populate the edit form
  useEffect(() => {
    let isCancelled = false;

    async function loadCustomer() {
      setIsFetching(true);
      setErrorMessage('');
      try {
        const customer = await fetchCustomerById(customer_id);
        if (!isCancelled && customer) {
          setFormData({
            email: customer.email || '',
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
            phone: customer.phone || '',
            active: Boolean(customer.active),
          });
        }
      } catch (err) {
        if (!isCancelled) {
          setErrorMessage(err.message || 'Failed to load customer details.');
        }
      } finally {
        if (!isCancelled) {
          setIsFetching(false);
        }
      }
    }

    if (customer_id) {
      loadCustomer();
    }

    return () => {
      isCancelled = true;
    };
  }, [customer_id]);

  // Handle standard text input changes
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Handle active status checkbox toggle
  function handleCheckboxChange(e) {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  }

  // Handle form submission to update customer details
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.phone.trim()) {
      setErrorMessage('Please fill in first name, last name, and phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCustomer(customer_id, {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        active: formData.active,
      });

      setSuccessMessage('Customer updated successfully! Redirecting…');
      setTimeout(() => {
        navigate('/admin/customers');
      }, 1000);
    } catch (err) {
      setErrorMessage(
        err.message || 'Failed to update customer. Please check the details and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isFetching) {
    return (
      <div className="container-fluid p-0">
        <div className="text-center py-5 text-muted">
          <div className="spinner-border spinner-border-sm me-2" role="status" />
          Loading customer information…
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      {/* Title with Customer Name and red accent line */}
      <div className="mb-2 d-flex align-items-center">
        <h2 className="fw-bold mb-0" style={{ color: '#0d1b42' }}>
          Edit: {formData.first_name} {formData.last_name}
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

      {/* Read-only customer email display matching UI design */}
      <p className="mb-4 fw-semibold" style={{ color: '#0d1b42', fontSize: '1.05rem' }}>
        Customer email:{' '}
        <span className="fw-normal text-muted" style={{ marginLeft: '4px' }}>
          {formData.email}
        </span>
      </p>

      {/* Form Container */}
      <div style={{ maxWidth: '650px' }}>
        {/* Status Alerts */}
        {errorMessage && (
          <div className="alert alert-danger mb-3" role="alert">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success mb-3" role="alert">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* First Name Input */}
          <div className="mb-3">
            <input
              type="text"
              name="first_name"
              className="form-control"
              placeholder="Customer first name"
              value={formData.first_name}
              onChange={handleChange}
              disabled={isSubmitting}
              required
              style={{ minHeight: '48px', fontSize: '0.95rem' }}
            />
          </div>

          {/* Last Name Input */}
          <div className="mb-3">
            <input
              type="text"
              name="last_name"
              className="form-control"
              placeholder="Customer last name"
              value={formData.last_name}
              onChange={handleChange}
              disabled={isSubmitting}
              required
              style={{ minHeight: '48px', fontSize: '0.95rem' }}
            />
          </div>

          {/* Phone Input */}
          <div className="mb-3">
            <input
              type="tel"
              name="phone"
              className="form-control"
              placeholder="Customer phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={isSubmitting}
              required
              style={{ minHeight: '48px', fontSize: '0.95rem' }}
            />
          </div>

          {/* Is Active Checkbox */}
          <div className="form-check mb-4">
            <input
              type="checkbox"
              name="active"
              id="isActiveCustomer"
              className="form-check-input"
              checked={formData.active}
              onChange={handleCheckboxChange}
              disabled={isSubmitting}
              style={{ width: '1.15rem', height: '1.15rem', cursor: 'pointer' }}
            />
            <label
              htmlFor="isActiveCustomer"
              className="form-check-label ms-2"
              style={{ color: '#0d1b42', cursor: 'pointer', fontSize: '0.95rem' }}
            >
              Is active customer
            </label>
          </div>

          {/* Submit Button */}
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
            {isSubmitting ? 'UPDATING…' : 'UPDATE'}
          </button>
        </form>
      </div>
    </div>
  );
}
