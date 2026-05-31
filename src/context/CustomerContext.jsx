import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_BASE, WS_URL, OWNER_URL } from '../utils/config.js';

const API = `${API_BASE}/customer`;

const CustomerContext = createContext();

export const useCustomer = () => {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
  return ctx;
};

export function useCustomerSlug() {
  const ctx = useContext(CustomerContext);
  if (!ctx) return null;
  const { slug: paramSlug } = useParams();
  return ctx.slug || paramSlug;
}

export const CustomerProvider = ({ children, slug: providerSlug }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem('foodapp_customer');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('foodapp_customer_token'));
  const [socket, setSocket] = useState(null);

  // Cart state (localStorage per restaurant)
  const getCartKey = (slug) => `foodapp_cart_${slug}`;

  const [cart, setCartState] = useState(() => {
    const saved = localStorage.getItem('foodapp_cart');
    return saved ? JSON.parse(saved) : { restaurantSlug: null, items: [] };
  });

  const saveCart = (c) => {
    setCartState(c);
    localStorage.setItem('foodapp_cart', JSON.stringify(c));
  };

  const addToCart = (restaurantSlug, item) => {
    setCartState(prev => {
      let newCart;
      if (prev.restaurantSlug && prev.restaurantSlug !== restaurantSlug) {
        if (!window.confirm('Cart mein dusray restaurant ki items hain. Cart clear kar ke naya item add karein?')) {
          return prev;
        }
        newCart = { restaurantSlug, items: [{ ...item, quantity: 1 }] };
      } else {
        const existing = prev.items.find(i => i.id === item.id);
        if (existing) {
          newCart = {
            restaurantSlug,
            items: prev.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
          };
        } else {
          newCart = { restaurantSlug, items: [...prev.items, { ...item, quantity: 1 }] };
        }
      }
      localStorage.setItem('foodapp_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCartState(prev => {
      const newItems = prev.items.map(i => {
        if (i.id === itemId) {
          const qty = i.quantity + delta;
          return qty < 1 ? null : { ...i, quantity: qty };
        }
        return i;
      }).filter(Boolean);
      const newCart = { ...prev, items: newItems };
      localStorage.setItem('foodapp_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const removeFromCart = (itemId) => {
    setCartState(prev => {
      const newCart = { ...prev, items: prev.items.filter(i => i.id !== itemId) };
      localStorage.setItem('foodapp_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const clearCart = () => {
    const empty = { restaurantSlug: null, items: [] };
    saveCart(empty);
  };

  const cartTotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  const loadLocalMenu = (restaurantId) => {
    const tryParse = (key) => {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch { return null; }
    };

    const saved = tryParse(`menu_${restaurantId}`) || tryParse('owner_menu');
    if (saved?.categories?.length > 0) {
      return saved.categories.map(cat => ({
        category: cat.name,
        items: cat.items || []
      }));
    }
    return [];
  };

  // Load restaurant data
  const loadRestaurant = useCallback(async (slug) => {
    setLoading(true);
    setError(null);
    try {
      const [resRes, menuRes] = await Promise.all([
        fetch(`${API}/restaurant/${slug}`),
        fetch(`${API}/restaurant/${slug}/menu`)
      ]);
      const resData = await resRes.json();
      const menuData = await menuRes.json();

      if (resData.success && resData.restaurant) {
        // Fix relative logo URLs (cross-service uploads)
        const fixLogo = (r) => {
          if (r.logo && r.logo.startsWith('/uploads/')) r.logo = OWNER_URL ? `${OWNER_URL.replace(/\/owner$/,'')}${r.logo}` : r.logo;
          return r;
        };
        fixLogo(resData.restaurant);
        // Merge API data with localStorage overrides (logo, branding)
        const localRests = (() => { try { return JSON.parse(localStorage.getItem('foodapp_restaurants')) || []; } catch { return []; } })();
        const localRest = localRests.find(r => r.slug === slug);
        const mergedRest = { ...resData.restaurant };
        if (localRest) {
          if (localRest.logo) mergedRest.logo = localRest.logo;
          if (localRest.primaryColor) mergedRest.primary_color = localRest.primaryColor;
          if (localRest.secondaryColor) mergedRest.secondary_color = localRest.secondaryColor;
          if (localRest.phone) mergedRest.phone = localRest.phone;
          if (localRest.whatsapp) mergedRest.whatsapp = localRest.whatsapp;
          if (localRest.address) mergedRest.address = localRest.address;
        }
        fixLogo(mergedRest);
        setRestaurant(mergedRest);
        // Fix relative image URLs for menu items
        const fixItemImages = (items) => {
          return items.map(cat => ({
            ...cat,
            items: (cat.items || []).map(item => ({
              ...item,
              image: item.image && item.image.startsWith('/uploads/')
                ? (OWNER_URL ? `${OWNER_URL.replace(/\/owner$/,'')}${item.image}` : item.image)
                : item.image
            }))
          }));
        };
        const apiMenu = menuData.menu || [];
        if (apiMenu.length > 0) {
          setMenu(fixItemImages(apiMenu));
        } else {
          // Try localStorage menu for this restaurant
          const localMenu = loadLocalMenu(resData.restaurant.id);
          setMenu(fixItemImages(localMenu));
        }
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      // Fallback: try localStorage (frontend data)
      const saved = localStorage.getItem('foodapp_restaurants');
      if (saved) {
        const all = JSON.parse(saved);
        const found = all.find(r => r.slug === slug);
        if (found) {
          setRestaurant({
            id: found.id,
            name: found.name,
            slug: found.slug,
            phone: found.phone,
            whatsapp: found.whatsapp,
            address: found.address,
            primary_color: found.primaryColor,
            secondary_color: found.secondaryColor,
            font_family: found.fontFamily,
            logo: found.logo,
            delivery_available: found.deliveryAvailable,
            pickup_available: found.pickupAvailable,
            active: found.active,
            plan: found.plan
          });
          setMenu(loadLocalMenu(found.id));
          setLoading(false);
          return;
        }
      }
      setError(err.message === 'API failed' ? 'Restaurant not found' : err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Customer auth
  const login = async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Login failed');
    setCustomer(data.customer);
    setToken(data.token);
    localStorage.setItem('foodapp_customer', JSON.stringify(data.customer));
    localStorage.setItem('foodapp_customer_token', data.token);
    return data;
  };

  const signup = async (name, email, phone, password) => {
    const res = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Signup failed');
    setCustomer(data.customer);
    setToken(data.token);
    localStorage.setItem('foodapp_customer', JSON.stringify(data.customer));
    localStorage.setItem('foodapp_customer_token', data.token);
    return data;
  };

  const logout = () => {
    setCustomer(null);
    setToken(null);
    localStorage.removeItem('foodapp_customer');
    localStorage.removeItem('foodapp_customer_token');
  };

  const placeOrder = async (orderData) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Order failed');
    return data;
  };

  const getOrderHistory = async () => {
    if (!customer || !token) return [];
    const res = await fetch(`${API}/orders/history/${customer.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) return [];
    return data.orders || [];
  };

  const getOrder = async (orderId) => {
    const res = await fetch(`${API}/orders/${orderId}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Order not found');
    return data.order;
  };

  // Socket.io
  useEffect(() => {
    const s = io(WS_URL, { transports: ['websocket', 'polling'] });
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  const { slug: paramSlug } = useParams();
  const nav = (path) => {
    if (providerSlug) return path;
    return `/r/${paramSlug}${path}`;
  };

  const value = {
    restaurant, menu, loading, error, loadRestaurant,
    slug: providerSlug, nav,
    customer, token, login, signup, logout,
    cart, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount,
    placeOrder, getOrderHistory, getOrder,
    socket
  };

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
};
