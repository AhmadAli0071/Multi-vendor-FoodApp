import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { db } from '../config/database.js';
import { sendNewOrderNotificationToRestaurant } from '../services/email.js';
import { sendNewOrderWhatsApp } from '../services/whatsapp.js';
import { sendPush } from '../services/push.js';
import PushSubscription from '../models/PushSubscription.js';

const router = express.Router();

// GET /api/customer/restaurants - List all active restaurants
router.get('/restaurants', async (req, res, next) => {
  try {
    const restaurants = await db.findAllRestaurants({ active: true });
    const list = (restaurants || []).map(r => ({
      id: r.id, name: r.name, slug: r.slug, phone: r.phone,
      address: r.address, primary_color: r.primary_color,
      secondary_color: r.secondary_color, logo: r.logo,
      delivery_available: r.delivery_available,
      pickup_available: r.pickup_available, plan: r.plan
    }));
    res.status(200).json({ success: true, restaurants: list });
  } catch (error) { next(error); }
});

// GET /api/customer/restaurant/:slug
router.get('/restaurant/:slug', async (req, res, next) => {
  try {
    const restaurant = await db.findRestaurantBySlug(req.params.slug);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.status(200).json({ success: true, restaurant: { id: restaurant.id, name: restaurant.name, slug: restaurant.slug, phone: restaurant.phone, whatsapp: restaurant.whatsapp, address: restaurant.address, primary_color: restaurant.primary_color, secondary_color: restaurant.secondary_color, font_family: restaurant.font_family, logo: restaurant.logo, delivery_available: restaurant.delivery_available, pickup_available: restaurant.pickup_available, opening_time: restaurant.opening_time, closing_time: restaurant.closing_time, estimated_delivery_time: restaurant.estimated_delivery_time, active: restaurant.active, plan: restaurant.plan } });
  } catch (error) { next(error); }
});

// GET /api/customer/restaurant/:slug/menu
router.get('/restaurant/:slug/menu', async (req, res, next) => {
  try {
    const restaurant = await db.findRestaurantBySlug(req.params.slug);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    // First try the embedded menu (from owner dashboard)
    if (restaurant.menu?.categories?.length > 0) {
      const menu = restaurant.menu.categories.map(cat => ({
        category: cat.name,
        category_icon: cat.icon,
        items: (cat.items || []).map(item => ({
          id: item._id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          available: item.isAvailable !== false && item.available !== false,
          popular: item.popular || false
        }))
      }));
      return res.status(200).json({ success: true, menu });
    }

    // Fallback to standalone MenuItem collection
    const menuItems = await db.findMenuItems(restaurant.id);
    res.status(200).json({ success: true, menu: menuItems });
  } catch (error) { next(error); }
});

// POST /api/customer/orders
router.post('/orders', [
  body('restaurant_id').notEmpty(), body('items').isArray({ min: 1 }), body('total').isFloat({ min: 0 }), body('order_type').isIn(['delivery', 'pickup']), body('customer_name').notEmpty().trim(), body('customer_phone').notEmpty().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { restaurant_id, items, total, order_type, customer_name, customer_phone, notes, address, customer_id } = req.body;
    const restaurant = await db.findRestaurantById(restaurant_id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    const orderId = 'ORD-' + Date.now();
    const order = {
      id: orderId,
      restaurant_id,
      customer_id: customer_id || null,
      customer_name,
      customer_phone,
      items,
      total: parseFloat(total),
      subtotal: parseFloat(total),
      delivery_fee: 0,
      status: 'pending',
      order_type: order_type,
      address: address || '',
      notes: notes || '',
      status_history: [{ status: 'pending', timestamp: new Date() }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
     await db.createOrder(order);

     // Emit socket event to owner's restaurant room
     try {
       const io = req.app.get('io');
       if (io) io.to(`restaurant:${restaurant_id}`).emit('new-order', {
         orderId: order.id,
         customerName: customer_name,
         total: parseFloat(total),
         items: items.length,
         timestamp: new Date().toISOString()
       });
     } catch (e) { console.error('Socket emit error:', e); }

      // Notify restaurant about new order (async)
      if (restaurant) {
        sendNewOrderNotificationToRestaurant(order, restaurant).catch(err => console.error('New order email error:', err));
        sendNewOrderWhatsApp(order, restaurant).catch(err => console.error('New order WhatsApp error:', err));
        // Push notification to owner
        PushSubscription.find({ restaurant_id, type: 'owner' }).then(subs => {
          subs.forEach(s => {
            sendPush(s.subscription, 'New Order!', `Order #${order.id.slice(-8)} — Rs. ${total}`, { url: '/' }).catch(() => {});
          });
        }).catch(err => console.error('Push find error:', err));
      }

    res.status(201).json({ success: true, message: 'Order placed!', order: { id: order.id, status: order.status, total: order.total, restaurant_name: restaurant.name, restaurant_phone: restaurant.whatsapp || restaurant.phone, created_at: order.created_at } });
  } catch (error) { next(error); }
});

// GET /api/customer/orders/:id
router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await db.findOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const restaurant = await db.findRestaurantById(order.restaurant_id);
    res.status(200).json({ success: true, order: { ...order, total: parseFloat(order.total), restaurant_name: restaurant ? restaurant.name : 'Unknown', restaurant_phone: restaurant ? (restaurant.whatsapp || restaurant.phone) : '' } });
  } catch (error) { next(error); }
});

// POST /api/customer/auth/signup
router.post('/auth/signup', [
  body('name').notEmpty().trim(), body('email').isEmail().normalizeEmail(), body('phone').notEmpty().trim(), body('password').isLength({ min: 6 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { name, email, phone, password } = req.body;
    const existing = await db.findCustomerByEmail(email);
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const customer = await db.createCustomer({ id: 'CUST-' + Date.now(), name, email, phone, password: hashedPassword });
    const token = jwt.sign({ id: customer.id, email: customer.email, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });
    res.status(201).json({ success: true, token, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
  } catch (error) { next(error); }
});

// POST /api/customer/auth/login
router.post('/auth/login', [body('email').isEmail().normalizeEmail(), body('password').notEmpty()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { email, password } = req.body;
    const customer = await db.findCustomerByEmail(email);
    if (!customer) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ id: customer.id, email: customer.email, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });
    res.status(200).json({ success: true, token, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
  } catch (error) { next(error); }
});

// GET /api/customer/auth/me
router.get('/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'customer') return res.status(401).json({ success: false, message: 'Not authorized' });
    const customer = await db.findCustomerById(decoded.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.status(200).json({ success: true, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
  } catch (error) { return res.status(401).json({ success: false, message: 'Not authorized' }); }
});

// GET /api/customer/orders/history/:customerId
router.get('/orders/history/:customerId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'customer' || decoded.id !== req.params.customerId) return res.status(403).json({ success: false, message: 'Not authorized' });
    const orders = await db.findOrdersByCustomerId(req.params.customerId);
    const enriched = await Promise.all(orders.map(async (o) => {
      const restaurant = await db.findRestaurantById(o.restaurant_id);
      return { ...o, total: parseFloat(o.total), restaurant_name: restaurant ? restaurant.name : 'Unknown' };
    }));
    res.status(200).json({ success: true, orders: enriched });
  } catch (error) { return res.status(401).json({ success: false, message: 'Not authorized' }); }
});

export default router;
