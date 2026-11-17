import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCustomer } from '../../../services/customer.service.js';

export default function AddCustomer() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle controlled input changes
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Handle form submission to create customer record
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Client-side quick validation
    if (
      !formData.email.trim() ||
      !formData.first_name.trim() ||
      !formData.last_name.trim() ||
      !formData.phone.trim()
    ) {
      setErrorMessage('Please fill in all customer fields.');
      return;
    }

    setIsLoading(true);

    try {
      await createCustomer({
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
      });

      setSuccessMessage('Customer created successfully! Redirecting…');
      setTimeout(() => {
        navigate('/admin/customers');
      }, 1000);
    } catch (err) {
      setErrorMessage(
        err.message || 'Failed to create customer. Please check the details and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container-fluid p-0">
      {/* Title with red accent line */}
      <div className="mb-4 d-flex align-items-center">
        <h2 className="fw-bold mb-0" style={{ color: '#0d1b42' }}>
          Add a new customer
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
          {/* Customer Email */}
          <div className="mb-3">
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="Customer email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              required
              style={{ minHeight: '48px', fontSize: '0.95rem' }}
            />
          </div>

          {/* Customer First Name */}
          <div className="mb-3">
            <input
              type="text"
              name="first_name"
              className="form-control"
              placeholder="Customer first name"
              value={formData.first_name}
              onChange={handleChange}
              disabled={isLoading}
              required
              style={{ minHeight: '48px', fontSize: '0.95rem' }}
            />
          </div>

          {/* Customer Last Name */}
          <div className="mb-3">
            <input
              type="text"
              name="last_name"
              className="form-control"
              placeholder="Customer last name"
              value={formData.last_name}
              onChange={handleChange}
              disabled={isLoading}
              required
              style={{ minHeight: '48px', fontSize: '0.95rem' }}
            />
          </div>

          {/* Customer Phone */}
          <div className="mb-4">
            <input
              type="tel"
              name="phone"
              className="form-control"
              placeholder="Customer phone (555-555-5555)"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
              required
              style={{ minHeight: '48px', fontSize: '0.95rem' }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn text-white fw-bold px-4 py-2"
            disabled={isLoading}
            style={{
              backgroundColor: '#df251c',
              border: 'none',
              borderRadius: '2px',
              fontSize: '0.9rem',
              letterSpacing: '0.5px',
              minHeight: '46px',
            }}
          >
            {isLoading ? 'ADDING CUSTOMER…' : 'ADD CUSTOMER'}
          </button>
        </form>
      </div>
    </div>
  );
}