import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE, WS_URL } from '../utils/config.js';

const OwnerContext = createContext();

export const useOwner = () => {
  const context = useContext(OwnerContext);
  if (!context) throw new Error('useOwner must be used within an OwnerProvider');
  return context;
};

export const OwnerProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('owner_logged_in') === 'true';
  });

  const [restaurant, setRestaurant] = useState(() => {
    const saved = localStorage.getItem('owner_restaurant');
    return saved ? JSON.parse(saved) : null;
  });

  const [menu, setMenu] = useState(() => {
    const saved = localStorage.getItem('owner_menu');
    return saved ? JSON.parse(saved) : { categories: [] };
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('owner_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('owner_isOpen');
    return saved !== null ? saved === 'true' : true;
  });

  const [apiAvailable, setApiAvailable] = useState(true);
  const menuRef = useRef(menu);
  menuRef.current = menu;
  const [socket, setSocket] = useState(null);
  const [pendingAlerts, setPendingAlerts] = useState([]); // new order popup alerts
  const socketRef = useRef(null);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Refresh restaurant data on mount (ensures payment_id etc. are up to date)
  useEffect(() => {
    if (!isLoggedIn || !restaurant?.id) return;
    const token = localStorage.getItem('owner_token');
    if (!token) return;
    fetch(`${API_BASE}/restaurants/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      if (d.success && d.data) {
        setRestaurant(d.data);
        localStorage.setItem('owner_restaurant', JSON.stringify(d.data));
      }
    }).catch(() => {});
  }, [isLoggedIn]);

  // Connect socket when logged in (handles page refresh / already logged in)
  useEffect(() => {
    if (!isLoggedIn || !restaurant) return;
    const token = localStorage.getItem('owner_token');
    if (!token) return;

    if (socketRef.current) socketRef.current.disconnect();
    const sock = io(WS_URL, { transports: ['websocket', 'polling'] });
    sock.emit('join-restaurant-room', restaurant.id);
    sock.on('new-order', (data) => {
      setPendingAlerts(prev => [...prev, data]);
      fetch(`${API_BASE}/orders?restaurant_id=${restaurant.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()).then(d => {
        if (d.success) setOrders(d.orders.map(normalizeOrder));
      }).catch(() => {});
    });
    sock.on('order-status-update', (data) => {
      setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o));
    });
    socketRef.current = sock;
    setSocket(sock);

    return () => { sock.disconnect(); };
  }, [isLoggedIn, restaurant?.id]);

  // Sync to localStorage always (backup)
  useEffect(() => { localStorage.setItem('owner_menu', JSON.stringify(menu)); }, [menu]);
  useEffect(() => { localStorage.setItem('owner_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('owner_isOpen', String(isOpen)); }, [isOpen]);
  useEffect(() => { if (restaurant) localStorage.setItem('owner_restaurant', JSON.stringify(restaurant)); }, [restaurant]);

  // Helper: get auth header
  const getAuthHeader = () => {
    const token = localStorage.getItem('owner_token');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
  };

  // Helper: normalize order fields from backend (snake_case → camelCase)
  const normalizeOrder = (o) => ({
    id: o.id,
    restaurantId: o.restaurant_id,
    customerName: o.customer_name,
    customerId: o.customer_id,
    phone: o.customer_phone,
    address: o.address,
    type: o.order_type,
    status: o.status,
    items: (o.items || []).map(i => ({ ...i, qty: i.quantity ?? i.qty ?? 1 })),
    total: parseFloat(o.total) || 0,
    notes: o.notes,
    createdAt: o.created_at || o.createdAt,
    updatedAt: o.updated_at || o.updatedAt,
    restaurantName: o.restaurant_name
  });

  // Login via API
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || 'Login failed' };

      const token = data.token;
      localStorage.setItem('owner_token', token);

      // Fetch restaurant data
      const restRes = await fetch(`${API_BASE}/restaurants/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const restData = await restRes.json();

      if (!restRes.ok) {
        localStorage.removeItem('owner_token');
        return { success: false, message: restData.message || 'Failed to load restaurant' };
      }

      const rest = restData.data;
      if (restData.data?.payment_id) rest.payment_id = restData.data.payment_id;
      setRestaurant(rest);
      setIsLoggedIn(true);
      localStorage.setItem('owner_logged_in', 'true');
      localStorage.setItem('owner_restaurant', JSON.stringify(rest));

      // Load menu from API or localStorage fallback
      if (rest.menu) {
        setMenu(rest.menu);
      } else {
        const savedMenu = localStorage.getItem(`menu_${rest.id}`);
        setMenu(savedMenu ? JSON.parse(savedMenu) : { categories: [] });
      }

      // Load orders from API
      try {
        const ordersRes = await fetch(`${API_BASE}/orders?restaurant_id=${rest.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          setOrders(ordersData.orders.map(normalizeOrder));
        } else {
          const savedOrders = localStorage.getItem(`orders_${rest.id}`);
          setOrders(savedOrders ? JSON.parse(savedOrders) : []);
        }
      } catch {
        const savedOrders = localStorage.getItem(`orders_${rest.id}`);
        setOrders(savedOrders ? JSON.parse(savedOrders) : []);
      }

      // Load isOpen from localStorage
      const savedIsOpen = localStorage.getItem(`isOpen_${rest.id}`);
      setIsOpen(savedIsOpen !== null ? savedIsOpen === 'true' : true);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Server error. Please try again.' };
    }
  };

  const logout = () => {
    if (restaurant) {
      localStorage.setItem(`menu_${restaurant.id}`, JSON.stringify(menu));
      localStorage.setItem(`orders_${restaurant.id}`, JSON.stringify(orders));
      localStorage.setItem(`isOpen_${restaurant.id}`, String(isOpen));
    }
    localStorage.removeItem('owner_token');
    localStorage.removeItem('owner_logged_in');
    if (socketRef.current) socketRef.current.disconnect();
    setSocket(null);
    setPendingAlerts([]);
    setRestaurant(null);
    setIsLoggedIn(false);
    setMenu({ categories: [] });
    setOrders([]);
  };

  // Sync menu to API
  const syncMenu = async () => {
    if (!apiAvailable || !restaurant) return;
    const token = localStorage.getItem('owner_token');
    if (!token) return;

    try {
      const currentCategories = menuRef.current?.categories || [];
      const res = await fetch(`${API_BASE}/menu`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categories: currentCategories })
      });
      if (!res.ok) setApiAvailable(false);
    } catch {
      setApiAvailable(false);
    }
  };

  const addCategory = (category) => {
    const newCat = { ...category, _id: `cat-${Date.now().toString(36)}-${Math.random().toString(36).substring(2,6)}`, items: [] };
    setMenu(prev => ({
      ...prev,
      categories: [...(prev.categories || []), newCat]
    }));
    syncMenu();
  };

  const updateCategory = (categoryId, updated) => {
    setMenu(prev => ({
      ...prev,
      categories: (prev.categories || []).map(cat => cat._id === categoryId ? { ...cat, ...updated } : cat)
    }));
    syncMenu();
  };

  const deleteCategory = (categoryId) => {
    setMenu(prev => ({
      ...prev,
      categories: (prev.categories || []).filter(cat => cat._id !== categoryId)
    }));
    syncMenu();
  };

  const addMenuItem = (categoryId, item) => {
    const newItem = { ...item, _id: `item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2,6)}`, createdAt: new Date().toISOString() };
    setMenu(prev => ({
      ...prev,
      categories: (prev.categories || []).map(cat =>
        cat._id === categoryId
          ? { ...cat, items: [...(cat.items || []), newItem] }
          : cat
      )
    }));
    syncMenu();
  };

  const updateMenuItem = (itemId, updatedItem) => {
    setMenu(prev => ({
      ...prev,
      categories: (prev.categories || []).map(cat => ({
        ...cat,
        items: (cat.items || []).map(item => item._id === itemId ? { ...item, ...updatedItem } : item)
      }))
    }));
    syncMenu();
  };

  const deleteMenuItem = (itemId) => {
    setMenu(prev => ({
      ...prev,
      categories: (prev.categories || []).map(cat => ({
        ...cat,
        items: (cat.items || []).filter(item => item._id !== itemId)
      }))
    }));
    syncMenu();
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    // Optimistic update
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));

    if (!apiAvailable || !restaurant) return;

    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) setApiAvailable(false);
    } catch {
      setApiAvailable(false);
    }
  };

  const updateRestaurant = async (data) => {
    const updated = { ...restaurant, ...data };
    setRestaurant(updated);
    localStorage.setItem('owner_restaurant', JSON.stringify(updated));

    if (!apiAvailable) return;

    try {
      const res = await fetch(`${API_BASE}/restaurants/${restaurant.id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(data)
      });
      if (!res.ok) setApiAvailable(false);
    } catch {
      setApiAvailable(false);
    }
  };

  const toggleOpen = () => {
    const newVal = !isOpen;
    setIsOpen(newVal);
    if (restaurant) {
      localStorage.setItem(`isOpen_${restaurant.id}`, String(newVal));
    }
  };

  const clearAllOrders = () => {
    setOrders([]);
    if (restaurant) {
      localStorage.setItem(`orders_${restaurant.id}`, JSON.stringify([]));
    }
  };

  const dismissAlert = (orderId) => {
    setPendingAlerts(prev => prev.filter(a => a.orderId !== orderId));
  };

  const stats = {
    todayOrders: orders.filter(o => o.createdAt?.startsWith(new Date().toISOString().split('T')[0])).length,
    pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'Pending').length,
    todayRevenue: orders
      .filter(o => o.createdAt?.startsWith(new Date().toISOString().split('T')[0]))
      .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0),
    totalItems: menu.categories?.reduce((sum, cat) => sum + (cat.items?.length || 0), 0) || 0
  };

  const value = {
    restaurant, menu, orders, stats, isOpen, isLoggedIn, apiAvailable,
    login, logout,
    addCategory, updateCategory, deleteCategory,
    addMenuItem, updateMenuItem, deleteMenuItem,
    updateOrderStatus, updateRestaurant, toggleOpen, clearAllOrders,
    pendingAlerts, dismissAlert, socket
  };

  return <OwnerContext.Provider value={value}>{children}</OwnerContext.Provider>;
};
