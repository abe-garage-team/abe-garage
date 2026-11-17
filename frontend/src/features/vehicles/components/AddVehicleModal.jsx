import { useState } from 'react';
import { createVehicle } from '../../../services/vehicle.service.js';

export default function AddVehicleModal({ show, onClose, customerId, onSuccess }) {
  const [formData, setFormData] = useState({
    year: '',
    make: '',
    model: '',
    type: '',
    mileage: '',
    plate: '',
    vin: '',
    color: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!show) return null;

  // Handle standard input changes
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Handle form submission to create vehicle
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (
      !formData.year ||
      !formData.make.trim() ||
      !formData.model.trim() ||
      !formData.type.trim() ||
      formData.mileage === '' ||
      !formData.plate.trim() ||
      !formData.color.trim()
    ) {
      setErrorMessage('Please fill in all required vehicle details.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        customer_id: Number(customerId),
        year: Number(formData.year),
        make: formData.make.trim(),
        model: formData.model.trim(),
        type: formData.type.trim(),
        mileage: Number(formData.mileage),
        plate: formData.plate.trim(),
        color: formData.color.trim(),
      };

      if (formData.vin && formData.vin.trim()) {
        payload.vin = formData.vin.trim();
      }

      const newVehicle = await createVehicle(payload);
      setSuccessMessage('Vehicle added successfully!');

      // Reset form
      setFormData({
        year: '',
        make: '',
        model: '',
        type: '',
        mileage: '',
        plate: '',
        vin: '',
        color: '',
      });

      if (onSuccess) {
        onSuccess(newVehicle);
      }

      setTimeout(() => {
        if (onClose) onClose();
      }, 800);
    } catch (err) {
      setErrorMessage(
        err.message || 'Failed to add vehicle. Please check the plate and details.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="card shadow border-0 mt-3 mb-4 position-relative"
      style={{ maxWidth: '650px' }}
    >
      {/* Red 'X' close button in the top right corner matching mockup */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close add vehicle form"
        className="btn btn-sm position-absolute top-0 end-0 m-3 d-flex align-items-center justify-content-center text-white"
        style={{
          backgroundColor: '#df251c',
          width: '26px',
          height: '26px',
          padding: 0,
          borderRadius: '3px',
          fontWeight: 'bold',
          lineHeight: 1,
        }}
      >
        ✕
      </button>

      <div className="card-body p-4">
        {/* Title with red accent line */}
        <div className="mb-4 d-flex align-items-center">
          <h4 className="fw-bold mb-0" style={{ color: '#0d1b42' }}>
            Add a new vehicle
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

        {/* Status Alerts */}
        {errorMessage && (
          <div className="alert alert-danger py-2 mb-3" role="alert">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success py-2 mb-3" role="alert">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Vehicle Year */}
          <div className="mb-3">
            <input
              type="number"
              name="year"
              className="form-control"
              placeholder="Vehicle year"
              value={formData.year}
              onChange={handleChange}
              disabled={isLoading}
              required
              min="1886"
              max={new Date().getFullYear() + 1}
              style={{ minHeight: '46px', fontSize: '0.95rem' }}
            />
          </div>

          {/* Vehicle Make */}
          <div className="mb-3">
            <input
              type="text"
              name="make"
              className="form-control"
              placeholder="Vehicle make"
              value={formData.make}
              onChange={handleChange}
              disabled={isLoading}
              required
              style={{ minHeight: '46px', fontSize: '0.95rem' }}
            />
          </div>

          {/* Vehicle Model */}
          <div className="mb-3">
            <input
              type="text"
              name="model"
              className="form-control"
              placeholder="Vehicle model"
              value={formData.model}
              onChange={handleChange}
              disabled={isLoading}
              required
              style={{ minHeight: '46px', fontSize: '0.95rem' }}
            />
          </div>

          {/* Vehicle Type */}
          <div className="mb-3">
            <input
              type="text"
              name="type"
              className="form-control"
              placeholder="Vehicle type"
              value={formData.type}
              onChange={handleChange}
              disabled={isLoading}
              required
              style={{ minHeight: '46px', fontSize: '0.95rem' }}
            />
          </div>

          {/* Vehicle Mileage */}
          <div className="mb-3">
            <input
              type="number"
              name="mileage"
              className="form-control"
              placeholder="Vehicle mileage"
              value={formData.mileage}
              onChange={handleChange}
              disabled={isLoading}
              required
              min="0"
              style={{ minHeight: '46px', fontSize: '0.95rem' }}
            />
          </div>

          {/* Vehicle Tag (Plate) */}
          <div className="mb-3">
            <input
              type="text"
              name="plate"
              className="form-control"
              placeholder="Vehicle tag"
              value={formData.plate}
              onChange={handleChange}
              disabled={isLoading}
              required
              style={{ minHeight: '46px', fontSize: '0.95rem' }}
            />
          </div>

          {/* Vehicle Serial (VIN) */}
          <div className="mb-3">
            <input
              type="text"
              name="vin"
              className="form-control"
              placeholder="Vehicle serial"
              value={formData.vin}
              onChange={handleChange}
              disabled={isLoading}
              style={{ minHeight: '46px', fontSize: '0.95rem' }}
            />
          </div>

          {/* Vehicle Color */}
          <div className="mb-4">
            <input
              type="text"
              name="color"
              className="form-control"
              placeholder="Vehicle color"
              value={formData.color}
              onChange={handleChange}
              disabled={isLoading}
              required
              style={{ minHeight: '46px', fontSize: '0.95rem' }}
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
            {isLoading ? 'ADDING VEHICLE…' : 'ADD VEHICLE'}
          </button>
        </form>
      </div>
    </div>
  );
}