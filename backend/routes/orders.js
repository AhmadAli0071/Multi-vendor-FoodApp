import express from 'express';
import { db } from '../config/database.js';
import { protect } from '../middleware/auth.js';
import { sendOrderStatusEmail, sendNewOrderNotificationToRestaurant } from '../services/email.js';
import { sendNewOrderWhatsApp } from '../services/whatsapp.js';
import { sendPush } from '../services/push.js';
import PushSubscription from '../models/PushSubscription.js';
import Order from '../models/Order.js';

const router = express.Router();

// Helper: check if user is admin or owner of the order
const authorizeOrderAccess = async (user, orderId) => {
  const order = await db.findOrderById(orderId);
  if (!order) return { authorized: false, order: null, error: 'Order not found' };

  if (user.role === 'admin') return { authorized: true, order };
  if (user.role === 'restaurant' && order.restaurant_id === user.restaurant_id) {
    return { authorized: true, order };
  }
  return { authorized: false, order: null, error: 'Not authorized' };
};

// PUT /api/orders/:id/status
router.put('/:id/status', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const { authorized, order, error } = await authorizeOrderAccess(req.user, id);
    if (!authorized) return res.status(403).json({ success: false, message: error });

    // Update status with history tracking via Mongoose document method
    const orderDoc = await Order.findOne({ id });
    if (!orderDoc) return res.status(404).json({ success: false, message: 'Order not found' });

    await orderDoc.updateStatus(status);

    const updated = orderDoc.toObject();

    // Socket.io broadcast
    try {
      const io = req.app.get('io');
      if (io) io.to(`order:${id}`).emit('order-status-update', {
        orderId: id,
        status,
        order: { ...updated, total: parseFloat(updated.total) },
        timestamp: new Date().toISOString()
      });
    } catch (socketErr) { console.error('Socket emit error:', socketErr); }

    // Push notification to customer
    if (status !== 'pending') {
      const statusLabels = { accepted: 'Order Accepted', preparing: 'Preparing Your Order', ready: 'Order Ready', delivered: 'Order Delivered', cancelled: 'Order Cancelled' };
      const msg = statusLabels[status] || `Status: ${status}`;
      PushSubscription.find({ order_id: id, type: 'customer' }).then(subs => {
        subs.forEach(s => {
          sendPush(s.subscription, msg, `Order #${id.slice(-8)} is now ${status}`, { url: `/${id}` }).catch(() => {});
        });
      }).catch(err => console.error('Push find error:', err));
    }

    // Send email to customer (async, non-blocking)
    if (status !== 'pending') {
      const restaurant = await db.findRestaurantById(order.restaurant_id);
      const customer = { name: order.customer_name, email: null, phone: order.customer_phone };
      if (order.customer_id) {
        const cust = await db.findCustomerById(order.customer_id);
        if (cust) customer.email = cust.email;
      }
      sendOrderStatusEmail(updated, restaurant, customer).catch(err => console.error('Email send error:', err));
    }

    res.status(200).json({ success: true, message: 'Order status updated', order: { ...updated, total: parseFloat(updated.total) } });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, date, page = 1, limit = 10 } = req.query;
    let { restaurant_id } = req.query;

    // If restaurant user, only show their own orders
    if (req.user.role === 'restaurant') {
      restaurant_id = req.user.restaurant_id;
    }

    let orders = await db.findAllOrders({ status, restaurant_id, date });
    const total = orders.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginated = orders.slice(start, start + parseInt(limit));

    const enriched = await Promise.all(paginated.map(async (o) => {
      const restaurant = await db.findRestaurantById(o.restaurant_id);
      return { ...o, total: parseFloat(o.total), restaurant_name: restaurant ? restaurant.name : 'Unknown', restaurant_email: restaurant ? restaurant.email : '' };
    }));

    res.status(200).json({ success: true, orders: enriched, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
});

// GET /api/orders/restaurant/:restaurantId (MUST be before /:id to avoid route conflict)
router.get('/restaurant/:restaurantId', protect, async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    if (req.user.role === 'restaurant' && req.user.restaurant_id !== restaurantId) return res.status(403).json({ success: false, message: 'Not authorized' });
    const orders = await db.findAllOrders({ restaurant_id: restaurantId });
    res.status(200).json({ success: true, orders: orders.slice(0, 100).map(o => ({ ...o, total: parseFloat(o.total) })) });
  } catch (error) { next(error); }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const { authorized, order, error } = await authorizeOrderAccess(req.user, req.params.id);
    if (!authorized) return res.status(403).json({ success: false, message: error });

    const restaurant = await db.findRestaurantById(order.restaurant_id);
    res.status(200).json({ success: true, order: { ...order, total: parseFloat(order.total), restaurant_name: restaurant ? restaurant.name : 'Unknown' } });
  } catch (error) { next(error); }
});

export default router;
