import { API_BASE } from './config.js';

let authToken = localStorage.getItem('admin_token') || null;

export const setToken = (token) => {
  authToken = token;
  if (token) localStorage.setItem('admin_token', token);
  else localStorage.removeItem('admin_token');
};

export const getToken = () => authToken;

const headers = () => {
  const h = { 'Content-Type': 'application/json' };
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;
  return h;
};

const apiCall = async (url, options = {}) => {
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers: { ...headers(), ...options.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API Error');
  return data;
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const token = getToken();
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'Authorization': token ? `Bearer ${token}` : '' },
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data.data.url;
};

export const api = {
  // Auth
  login: (email, password) =>
    apiCall('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  // Dashboard
  getStats: () => apiCall('/admin/dashboard-stats'),

  // Restaurants
  getRestaurants: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiCall(`/restaurants${q ? '?' + q : ''}`);
  },
  getRestaurant: (id) => apiCall(`/restaurants/${id}`),
  createRestaurant: (data) => apiCall('/restaurants', { method: 'POST', body: JSON.stringify(data) }),
  updateRestaurant: (id, data) => apiCall(`/restaurants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRestaurant: (id) => apiCall(`/restaurants/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiCall(`/orders${q ? '?' + q : ''}`);
  },
  updateOrderStatus: (id, status) => apiCall(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Subscriptions
  getSubscriptions: () => apiCall('/subscriptions'),
  renewSubscription: (id, months, paymentMethod) =>
    apiCall(`/subscriptions/${id}/renew`, { method: 'POST', body: JSON.stringify({ months, paymentMethod }) }),
  changePlan: (id, newPlan) =>
    apiCall(`/subscriptions/${id}/change-plan`, { method: 'PUT', body: JSON.stringify({ newPlan }) }),

  // Broadcast
  sendBroadcast: (data) => apiCall('/broadcast', { method: 'POST', body: JSON.stringify(data) })
};
