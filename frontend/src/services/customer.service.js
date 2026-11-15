import { apiRequest } from './core/api-client.js';

// Fetch paginated customers with optional debounced search term
export async function fetchCustomers({ search = '', page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (search && search.trim()) {
    params.set('search', search.trim());
  }
  if (page) {
    params.set('page', String(page));
  }
  if (limit) {
    params.set('limit', String(limit));
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiRequest(`/customers${query}`);
  return response.data;
}

// Fetch single customer profile with owned vehicles, recent orders, and financial summary
export async function fetchCustomerById(customerId) {
  const response = await apiRequest(`/customers/${customerId}`);
  return response.data;
}

// Create a new customer record
export async function createCustomer(data) {
  const response = await apiRequest('/customers', {
    method: 'POST',
    body: data,
  });
  return response.data;
}

// Update existing customer details or toggle active status
export async function updateCustomer(customerId, data) {
  const response = await apiRequest(`/customers/${customerId}`, {
    method: 'PATCH',
    body: data,
  });
  return response.data;
}

// Fetch all registered vehicles for a specific customer
export async function fetchCustomerVehicles(customerId) {
  const response = await apiRequest(`/customers/${customerId}/vehicles`);
  return response.data;
}