/* global URLSearchParams */
import { apiRequest } from './core/api-client.js';

// Fetch staff services catalog with optional search, active status filter, and pagination
export async function fetchServices({ search = '', active, page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (search && search.trim()) {
    params.set('search', search.trim());
  }
  if (active !== undefined && active !== '') {
    params.set('active', String(active));
  }
  if (page) {
    params.set('page', String(page));
  }
  if (limit) {
    params.set('limit', String(limit));
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await apiRequest(`/services${query}`);
  return response.data;
}

// Create a new garage service entry in the catalog (Admin only)
export async function createService(data) {
  const response = await apiRequest('/services', {
    method: 'POST',
    body: data,
  });
  return response.data;
}

// Update existing service pricing, labor hours, description, or active status (Admin only)
export async function updateService(serviceId, data) {
  const response = await apiRequest(`/services/${serviceId}`, {
    method: 'PATCH',
    body: data,
  });
  return response.data;
}

// Fetch public services and pricing for marketing site (no auth required)
export async function fetchPublicServices({ search = '', page = 1, limit = 10 } = {}) {
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
  const response = await apiRequest(`/public/services${query}`, {
    authenticated: false,
  });
  return response.data;
}
