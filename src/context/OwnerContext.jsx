import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE, WS_URL } from '../utils/config.js';
import toast from 'react-hot-toast';

const OwnerContext = createContext();

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

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
  const syncTimeoutRef = useRef(null);
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
      } else if (d.data?.active === false || d.message?.toLowerCase().includes('inactive') || d.message?.toLowerCase().includes('deactivated')) {
        logout();
        toast.error('Your subscription has been deactivated by admin.');
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

  // Poll orders every 10s (catches orders from other Render services where socket.io can't cross)
  useEffect(() => {
    if (!isLoggedIn || !restaurant) return;
    const token = localStorage.getItem('owner_token');
    if (!token) return;
    const clearedAt = localStorage.getItem(`clearedOrders_${restaurant.id}`);
    const fetchOrders = () => {
      fetch(`${API_BASE}/orders?restaurant_id=${restaurant.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()).then(d => {
        if (!d.success) return;
        const cutoff = localStorage.getItem(`clearedOrders_${restaurant.id}`);
        const orders = d.orders.map(normalizeOrder).filter(o => !cutoff || new Date(o.createdAt) > new Date(cutoff));
        setOrders(orders);
      }).catch(() => {});
    };
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
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
    // Step 1: Request push permission EARLY (before any await — preserves user gesture)
    let pushSubData = null;
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          const pkRes = await fetch(`${API_BASE}/push/vapid-public-key`);
          const { publicKey } = await pkRes.json();
          if (publicKey) {
            const reg = await navigator.serviceWorker.ready;
            let sub = await reg.pushManager.getSubscription();
            if (!sub) {
              sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
              });
            }
            pushSubData = { subscription: sub.toJSON(), type: 'owner' };
          }
        }
      }
    } catch (_) { /* non-blocking */ }

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
          const cutoff = localStorage.getItem(`clearedOrders_${rest.id}`);
          const filtered = ordersData.orders.map(normalizeOrder).filter(o => !cutoff || new Date(o.createdAt) > new Date(cutoff));
          setOrders(filtered);
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

      // Register push subscription on server with restaurant ID
      if (pushSubData && rest?.id) {
        pushSubData.restaurant_id = rest.id;
        fetch(`${API_BASE}/push/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pushSubData)
        }).then(r => r.json()).then(d => {
          if (d.success) console.log('Push subscribed for owner');
          else console.warn('Push subscribe failed:', d.message);
        }).catch(e => console.warn('Push subscribe error:', e));
      }

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

  // Sync menu to API (debounced)
  const syncMenu = () => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
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
        if (!res.ok) {
          setApiAvailable(false);
          toast.error('Menu save failed — changes only saved locally');
        }
      } catch {
        setApiAvailable(false);
        toast.error('Menu save failed — changes only saved locally');
      }
    }, 600);
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
      categories: (prev.categories || []).map(cat => (cat._id === categoryId || cat.id === categoryId) ? { ...cat, ...updated } : cat)
    }));
    syncMenu();
  };

  const deleteCategory = async (categoryId) => {
    setMenu(prev => ({
      ...prev,
      categories: (prev.categories || []).filter(cat => cat._id !== categoryId && cat.id !== categoryId)
    }));
    if (apiAvailable && restaurant) {
      const token = localStorage.getItem('owner_token');
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/menu/categories/${categoryId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          setApiAvailable(false);
          syncMenu();
          return;
        }
      } catch {
        setApiAvailable(false);
        syncMenu();
        return;
      }
    }
    syncMenu();
  };

  const addMenuItem = (categoryId, item) => {
    const newItem = { ...item, _id: `item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2,6)}`, createdAt: new Date().toISOString() };
    setMenu(prev => ({
      ...prev,
      categories: (prev.categories || []).map(cat =>
        (cat._id === categoryId || cat.id === categoryId)
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
        items: (cat.items || []).map(item => (item._id === itemId || item.id === itemId) ? { ...item, ...updatedItem } : item)
      }))
    }));
    syncMenu();
  };

  const deleteMenuItem = async (itemId) => {
    setMenu(prev => ({
      ...prev,
      categories: (prev.categories || []).map(cat => ({
        ...cat,
        items: (cat.items || []).filter(item => item._id !== itemId && item.id !== itemId)
      }))
    }));
    if (apiAvailable && restaurant) {
      const token = localStorage.getItem('owner_token');
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/menu/items/${itemId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          setApiAvailable(false);
          syncMenu();
          return;
        }
      } catch {
        setApiAvailable(false);
        syncMenu();
        return;
      }
    }
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
    const updated = {
      ...restaurant,
      ...data,
      primary_color: data.primaryColor ?? restaurant?.primary_color,
      secondary_color: data.secondaryColor ?? restaurant?.secondary_color,
      delivery_available: data.deliveryAvailable ?? restaurant?.delivery_available,
      pickup_available: data.pickupAvailable ?? restaurant?.pickup_available,
      opening_time: data.openingTime ?? restaurant?.opening_time,
      closing_time: data.closingTime ?? restaurant?.closing_time,
      estimated_delivery_time: data.estimatedDeliveryTime ?? restaurant?.estimated_delivery_time,
      min_order_amount: data.minOrderAmount ?? restaurant?.min_order_amount,
      font_family: data.fontFamily ?? restaurant?.font_family,
    };
    ['primaryColor','secondaryColor','deliveryAvailable','pickupAvailable','openingTime','closingTime','estimatedDeliveryTime','minOrderAmount','fontFamily'].forEach(k => delete updated[k]);
    setRestaurant(updated);
    localStorage.setItem('owner_restaurant', JSON.stringify(updated));

    if (!apiAvailable) return;

    try {
      const res = await fetch(`${API_BASE}/restaurants/me`, {
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
      localStorage.setItem(`clearedOrders_${restaurant.id}`, new Date().toISOString());
    }
  };

  const dismissAlert = (orderId) => {
    setPendingAlerts(prev => prev.filter(a => a.orderId !== orderId));
  };

  const stats = {
    todayOrders: orders.filter(o => o.createdAt?.startsWith(new Date().toISOString().split('T')[0])).length,
    pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'Pending').length,
    todayRevenue: orders
      .filter(o => o.createdAt?.startsWith(new Date().toISOString().split('T')[0]) && o.status === 'delivered')
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
