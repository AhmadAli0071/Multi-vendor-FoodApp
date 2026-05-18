import { API_BASE } from './config.js';

const getToken = () => localStorage.getItem('owner_token');

export const setOwnerToken = (token) => {
  if (token) localStorage.setItem('owner_token', token);
  else localStorage.removeItem('owner_token');
};

const headers = () => {
  const token = getToken();
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

export const ownerApi = {
  // Menu
  getMenu: () => fetch(`${API_BASE}/menu`, { headers: headers() }).then(r => r.json()),

  updateMenu: (menuData) =>
    fetch(`${API_BASE}/menu`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(menuData)
    }).then(r => r.json()),

  // Restaurant
  getMyRestaurant: () =>
    fetch(`${API_BASE}/restaurants/me`, { headers: headers() }).then(r => r.json()),

  updateRestaurant: (data) =>
    fetch(`${API_BASE}/restaurants/me`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(r => r.json()),

  // Orders
  updateOrderStatus: (orderId, status) =>
    fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ status })
    }).then(r => r.json()),

  // Upload
  uploadImage: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data.data.url;
  }
};
