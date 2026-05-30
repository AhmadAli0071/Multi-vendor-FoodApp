import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/database.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { generatePaymentId } from '../utils/paymentId.js';

const router = express.Router();

// GET /api/restaurants/me - Get current restaurant's data (owner dashboard)
router.get('/me', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'restaurant') {
      return res.status(403).json({ success: false, message: 'Restaurant access only' });
    }

    const restaurant = await db.findRestaurantById(req.user.restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    if (!restaurant.active) {
      return res.status(403).json({ success: false, message: 'Your subscription is inactive. Please contact admin.', data: { active: false } });
    }

    res.json({
      success: true,
      data: {
        ...restaurant,
        payment_id: restaurant.payment_id,
        subscriptionStart: restaurant.subscription_start,
        subscriptionEnd: restaurant.subscription_end,
        createdAt: restaurant.created_at,
        updatedAt: restaurant.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/restaurants/me - Update own restaurant (owner)
router.put('/me', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'restaurant') {
      return res.status(403).json({ success: false, message: 'Restaurant access only' });
    }

    const { name, phone, whatsapp, address, primaryColor, secondaryColor, fontFamily, logo, deliveryAvailable, pickupAvailable, openingTime, closingTime, estimatedDeliveryTime, minOrderAmount } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (whatsapp !== undefined) updates.whatsapp = whatsapp;
    if (address !== undefined) updates.address = address;
    if (primaryColor !== undefined) updates.primary_color = primaryColor;
    if (secondaryColor !== undefined) updates.secondary_color = secondaryColor;
    if (fontFamily !== undefined) updates.font_family = fontFamily;
    if (logo !== undefined) updates.logo = logo;
    if (deliveryAvailable !== undefined) updates.delivery_available = deliveryAvailable;
    if (pickupAvailable !== undefined) updates.pickup_available = pickupAvailable;
    if (openingTime !== undefined) updates.opening_time = openingTime;
    if (closingTime !== undefined) updates.closing_time = closingTime;
    if (estimatedDeliveryTime !== undefined) updates.estimated_delivery_time = estimatedDeliveryTime;
    if (minOrderAmount !== undefined) updates.min_order_amount = minOrderAmount;

    const updated = await db.updateRestaurant(req.user.restaurant_id, updates);
    res.json({ success: true, message: 'Restaurant updated', restaurant: { ...updated, subscriptionStart: updated.subscription_start, subscriptionEnd: updated.subscription_end, createdAt: updated.created_at, updatedAt: updated.updated_at } });
  } catch (error) {
    next(error);
  }
});

// GET /api/restaurants
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { search, plan, page = 1, limit = 50 } = req.query;
    let restaurants = await db.findAllRestaurants({ search, plan });

    const total = restaurants.length;
    const start = (page - 1) * limit;
    const paginated = restaurants.slice(start, start + parseInt(limit));

    const today = new Date().toISOString().split('T')[0];
    const enriched = await Promise.all(paginated.map(async (r) => {
      const orders = await db.findAllOrders({ restaurant_id: r.id, date: today });
      return { ...r, todayOrders: orders.length };
    }));

    res.status(200).json({ success: true, restaurants: enriched, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

// GET /api/restaurants/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const restaurant = await db.findRestaurantById(id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    const orders = await db.findAllOrders({ restaurant_id: id });
    const sliced = orders.slice(0, 50);

    res.status(200).json({
      success: true,
      restaurant: {
        ...restaurant,
        subscriptionStart: restaurant.subscription_start,
        subscriptionEnd: restaurant.subscription_end,
        createdAt: restaurant.created_at,
        updatedAt: restaurant.updated_at
      },
      orders: sliced
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/restaurants
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { name, email, password, phone, whatsapp, address, primaryColor, secondaryColor, fontFamily, logo, deliveryAvailable, pickupAvailable, plan, subscriptionStart, subscriptionEnd } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
    const restaurantId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const paymentId = await generatePaymentId();
    await db.createRestaurant({ id: restaurantId, name, email, password: hashedPassword, phone, whatsapp, address, primary_color: primaryColor, secondary_color: secondaryColor, font_family: fontFamily, logo: logo || null, slug, delivery_available: deliveryAvailable, pickup_available: pickupAvailable, plan, subscription_start: subscriptionStart, subscription_end: subscriptionEnd, active: true, payment_id: paymentId });
    await db.createUser({ id: 'USER_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6), email, password: hashedPassword, role: 'restaurant', restaurant_id: restaurantId });

    const planPrices = { Starter: 2999, Business: 5999, Premium: 9999 };
    await db.createPayment({ id: 'PAY_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6), restaurant_id: restaurantId, plan, amount: planPrices[plan], payment_method: 'Cash', status: 'completed', payment_date: subscriptionStart });

    res.status(201).json({ success: true, message: 'Restaurant created successfully', restaurant: { id: restaurantId, name, email, slug, plan, active: true, payment_id: paymentId } });
  } catch (error) {
    if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
      return res.status(400).json({ success: false, message: 'Email or slug already exists' });
    }
    next(error);
  }
});

// PUT /api/restaurants/:id
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const restaurant = await db.findRestaurantById(id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    const { name, email, phone, whatsapp, address, primaryColor, secondaryColor, fontFamily, logo, deliveryAvailable, pickupAvailable, plan, subscriptionStart, subscriptionEnd, active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (whatsapp !== undefined) updates.whatsapp = whatsapp;
    if (address !== undefined) updates.address = address;
    if (primaryColor !== undefined) updates.primary_color = primaryColor;
    if (secondaryColor !== undefined) updates.secondary_color = secondaryColor;
    if (fontFamily !== undefined) updates.font_family = fontFamily;
    if (logo !== undefined) updates.logo = logo;
    if (deliveryAvailable !== undefined) updates.delivery_available = deliveryAvailable;
    if (pickupAvailable !== undefined) updates.pickup_available = pickupAvailable;
    if (plan !== undefined) updates.plan = plan;
    if (subscriptionStart !== undefined) updates.subscription_start = subscriptionStart;
    if (subscriptionEnd !== undefined) updates.subscription_end = subscriptionEnd;
    if (active !== undefined) updates.active = active;
    if (name) updates.slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

    const updated = await db.updateRestaurant(id, updates);
    res.status(200).json({ success: true, message: 'Restaurant updated successfully', restaurant: { ...updated, subscriptionStart: updated.subscription_start, subscriptionEnd: updated.subscription_end, createdAt: updated.created_at, updatedAt: updated.updated_at } });
  } catch (error) {
    if (error.message?.includes('duplicate')) return res.status(400).json({ success: false, message: 'Email or slug already exists' });
    next(error);
  }
});

// DELETE /api/restaurants/:id
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteRestaurant(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.status(200).json({ success: true, message: 'Restaurant deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
