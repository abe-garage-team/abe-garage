/* global URLSearchParams */
import { apiRequest } from './core/api-client.js';

// Create a new vehicle registration attached to a customer
export async function createVehicle(data) {
  const response = await apiRequest('/vehicles', {
    method: 'POST',
    body: data,
  });
  return response.data;
}

// Fetch single vehicle specifications by its vehicle ID
export async function fetchVehicleById(vehicleId) {
  const response = await apiRequest(`/vehicles/${vehicleId}`);
  return response.data;
}

// Update vehicle specifications or odometer mileage
export async function updateVehicle(vehicleId, data) {
  const response = await apiRequest(`/vehicles/${vehicleId}`, {
    method: 'PATCH',
    body: data,
  });
  return response.data;
}

// Fetch repair orders and service history for a specific vehicle with optional pagination
export async function fetchVehicleServiceHistory(vehicleId, { page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (page) {
    params.set('page', String(page));
  }
  if (limit) {
    params.set('limit', String(limit));
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiRequest(`/vehicles/${vehicleId}/orders${query}`);
  return response.data;
}

// Fetch all registered vehicles for a specific customer
export async function fetchVehiclesByCustomerId(customerId) {
  const response = await apiRequest(`/customers/${customerId}/vehicles`);
  return response.data;
}
