import { apiRequest } from './core/api-client.js';

export async function fetchOrders({ search, status, paid, page = 1, limit = 10, signal } = {}) {
  const response = await apiRequest('/orders', {
    query: { search: search?.trim(), status, paid, page, limit },
    signal,
  });
  return response.data;
}

export async function fetchOrder(orderId, { signal } = {}) {
  const response = await apiRequest(`/orders/${orderId}`, { signal });
  return response.data;
}

export async function createOrder(payload) {
  const response = await apiRequest('/orders', { method: 'POST', body: payload });
  return response.data;
}

export async function updateOrder(orderId, changes) {
  const response = await apiRequest(`/orders/${orderId}`, { method: 'PATCH', body: changes });
  return response.data;
}

export async function recordApproval(orderId, { decision, approval_method }) {
  const response = await apiRequest(`/orders/${orderId}/approval`, {
    method: 'PATCH',
    body: { decision, approval_method },
  });
  return response.data;
}

export async function addExtraJob(orderId, line) {
  const response = await apiRequest(`/orders/${orderId}/lines`, { method: 'POST', body: line });
  return response.data;
}

export async function fetchEstimate(orderId, { signal } = {}) {
  const response = await apiRequest(`/orders/${orderId}/estimate`, { signal });
  return response.data;
}
