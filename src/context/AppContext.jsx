import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, getToken } from '../utils/api';
import { API_BASE } from '../utils/config';
import toast from 'react-hot-toast';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

const computeStats = (rests, ords) => {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const todayOrdersList = ords.filter(o => {
    const d = new Date(o.createdAt).toISOString().split('T')[0];
    return d === today;
  });

  const activeOrders = ords.filter(o => o.status !== 'delivered').length;

  const monthlyRevenue = ords
    .filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

  return {
    totalRestaurants: rests.length,
    activeOrders,
    todayOrders: todayOrdersList.length,
    monthlyRevenue: Math.round(monthlyRevenue)
  };
};

export const AppProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [useApi, setUseApi] = useState(false);

  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalRestaurants: 0, activeOrders: 0, todayOrders: 0, monthlyRevenue: 0 });

  // Persist to localStorage
  useEffect(() => { localStorage.setItem('foodapp_restaurants', JSON.stringify(restaurants)); }, [restaurants]);
  useEffect(() => { localStorage.setItem('foodapp_orders', JSON.stringify(orders)); }, [orders]);

  // Recompute stats when data changes (not when using API - API provides stats)
  useEffect(() => {
    if (!useApi) setStats(computeStats(restaurants, orders));
  }, [restaurants, orders, useApi]);

  useEffect(() => {
    const init = async () => {
      const savedToken = getToken();
      if (savedToken) {
        try {
          const [statsRes, restRes, ordersRes] = await Promise.all([
            api.getStats(),
            api.getRestaurants({ limit: '100' }),
            api.getOrders({ limit: '200' })
          ]);
          setStats(statsRes.stats);
          setRestaurants(restRes.restaurants.map(r => normalizeRestaurant(r)));
          setOrders(ordersRes.orders.map(normalizeOrder));
          setUseApi(true);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        } catch { setToken(null); }
      }
      try {
        const res = await fetch(`${API_BASE}/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@foodapp.pk',
            password: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
          })
        });
        const data = await res.json();
        if (data.success) {
          setToken(data.token);
          setIsAuthenticated(true);
          setUseApi(true);
          await refreshAll();
        }
      } catch { /* offline */ }
      setIsLoading(false);
    };
    init();
  }, []);

  // Normalize backend snake_case to frontend camelCase
  const normalizeRestaurant = (r) => ({
    id: r.id, name: r.name, email: r.email, phone: r.phone || '',
    whatsapp: r.whatsapp || '', address: r.address || '',
    primaryColor: r.primary_color || '#FF6B35', secondaryColor: r.secondary_color || '#FFFFFF',
    fontFamily: r.font_family || 'Poppins', logo: r.logo,
    slug: r.slug, deliveryAvailable: r.delivery_available, pickupAvailable: r.pickup_available,
    plan: r.plan, subscriptionStart: r.subscription_start || r.subscriptionStart || '',
    subscriptionEnd: r.subscription_end || r.subscriptionEnd || '',
    active: r.active !== false, createdAt: r.created_at || r.createdAt || '',
    todayOrders: r.todayOrders || 0,
    paymentId: r.payment_id || ''
  });

  const normalizeOrder = (o) => ({
    id: o.id, restaurantId: o.restaurant_id, customerName: o.customer_name,
    customerPhone: o.customer_phone, items: o.items || 'N/A',
    total: parseFloat(o.total) || 0, status: o.status || 'pending',
    type: o.order_type, address: o.address || '', notes: o.notes || '',
    createdAt: o.created_at, phone: o.customer_phone,
    restaurantName: o.restaurant_name || ''
  });

  // Login
  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    setToken(data.token);
    setIsAuthenticated(true);
    setUseApi(true);
    await refreshAll();
    return data;
  };

  const logout = () => {
    setToken(null);
    setIsAuthenticated(false);
    setUseApi(false);
    setRestaurants([]);
    setOrders([]);
    setStats({ totalRestaurants: 0, activeOrders: 0, todayOrders: 0, monthlyRevenue: 0 });
    localStorage.removeItem('foodapp_restaurants');
    localStorage.removeItem('foodapp_orders');
  };

  const refreshAll = async () => {
    try {
      const [statsRes, restRes, ordersRes] = await Promise.all([
        api.getStats(),
        api.getRestaurants({ limit: '100' }),
        api.getOrders({ limit: '200' })
      ]);
      setStats(statsRes.stats);
      setRestaurants(restRes.restaurants.map(normalizeRestaurant));
      setOrders(ordersRes.orders.map(normalizeOrder));
    } catch { /* silent */ }
  };

  // Restaurant CRUD
  const addRestaurant = async (restaurant) => {
    const payload = {
      name: restaurant.name, email: restaurant.email, password: restaurant.password,
      phone: restaurant.phone, whatsapp: restaurant.whatsapp, address: restaurant.address,
      primaryColor: restaurant.primaryColor, secondaryColor: restaurant.secondaryColor,
      fontFamily: restaurant.fontFamily, logo: restaurant.logo,
      deliveryAvailable: restaurant.deliveryAvailable,
      pickupAvailable: restaurant.pickupAvailable, plan: restaurant.plan,
      subscriptionStart: restaurant.subscriptionStart, subscriptionEnd: restaurant.subscriptionEnd
    };

    if (useApi) {
      try {
        const data = await api.createRestaurant(payload);
        await refreshAll();
        const created = { id: data.restaurant.id, slug: restaurant.slug, paymentId: data.restaurant.payment_id, ...restaurant };
        return created;
      } catch (err) {
        toast.error(err.message);
      }
    }

    // Fallback: localStorage
    const newR = { ...restaurant, id: Date.now().toString(), active: true, createdAt: new Date().toISOString() };
    setRestaurants(prev => [...prev, newR]);
    return newR;
  };

  const updateRestaurant = async (id, updatedData) => {
    if (useApi) {
      try {
        await api.updateRestaurant(id, updatedData);
        await refreshAll();
        return;
      } catch (err) { toast.error(err.message); }
    }
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
  };

  const deleteRestaurant = async (id) => {
    if (useApi) {
      try {
        await api.deleteRestaurant(id);
        await refreshAll();
        return;
      } catch (err) { toast.error(err.message); }
    }
    setRestaurants(prev => prev.filter(r => r.id !== id));
  };

  const renewSubscription = async (id, months) => {
    if (useApi) {
      try {
        await api.renewSubscription(id, months, 'Cash');
        await refreshAll();
        return;
      } catch (err) { toast.error(err.message); }
    }
    setRestaurants(prev => prev.map(r => {
      if (r.id === id) {
        const start = new Date(); const end = new Date();
        end.setMonth(end.getMonth() + months);
        return { ...r, subscriptionStart: start.toISOString().split('T')[0], subscriptionEnd: end.toISOString().split('T')[0], active: true };
      }
      return r;
    }));
  };

  const getRestaurantById = (id) => restaurants.find(r => r.id === id);

  // Order status update
  const updateOrderStatus = async (orderId, status) => {
    if (useApi) {
      try {
        await api.updateOrderStatus(orderId, status);
        await refreshAll();
        return;
      } catch (err) { toast.error(err.message); }
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  // Broadcast
  const sendBroadcast = async (data) => {
    return api.sendBroadcast(data);
  };

  const value = {
    restaurants, orders, stats, isLoading, isAuthenticated, useApi,
    login, logout, refreshAll,
    addRestaurant, updateRestaurant, deleteRestaurant,
    renewSubscription, getRestaurantById,
    updateOrderStatus, sendBroadcast
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
