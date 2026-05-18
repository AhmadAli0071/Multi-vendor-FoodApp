import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import { protect } from '../middleware/auth.js';
import { generatePaymentId } from '../utils/paymentId.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await db.findUserByEmail(email);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });
    let restaurant = null;
    if (user.role === 'restaurant' && user.restaurant_id) {
      restaurant = await db.findRestaurantById(user.restaurant_id);
    }
    res.status(200).json({ success: true, token, user: { id: user.id, email: user.email, role: user.role, restaurant: restaurant ? { id: restaurant.id, name: restaurant.name, email: restaurant.email, plan: restaurant.plan, active: restaurant.active } : null } });
  } catch (error) { next(error); }
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, plan, phone, whatsapp, address } = req.body;
    if (!name || !email || !password || !plan) return res.status(400).json({ success: false, message: 'Required fields missing' });
    const existing = await db.findUserByEmail(email);
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
    const restaurantId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    const userId = 'USER_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(); endDate.setMonth(endDate.getMonth() + 1); const endDateStr = endDate.toISOString().split('T')[0];

    const paymentId = await generatePaymentId();
    await db.createRestaurant({ id: restaurantId, name, email, password: hashedPassword, phone, whatsapp, address, primary_color: '#FF6B35', secondary_color: '#FFFFFF', font_family: 'Poppins', slug, delivery_available: true, pickup_available: true, plan, subscription_start: startDate, subscription_end: endDateStr, active: true, payment_id: paymentId });
    await db.createUser({ id: userId, email, password: hashedPassword, role: 'restaurant', restaurant_id: restaurantId });
    const planPrices = { Starter: 2999, Business: 5999, Premium: 9999 };
    await db.createPayment({ id: 'PAY_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6), restaurant_id: restaurantId, plan, amount: planPrices[plan], payment_method: 'Cash', status: 'completed', payment_date: startDate });

    const token = jwt.sign({ id: userId, email, role: 'restaurant' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });
    res.status(201).json({ success: true, token, message: 'Restaurant registered', restaurant: { id: restaurantId, name, email, plan, slug, subscriptionStart: startDate, subscriptionEnd: endDateStr, active: true } });
  } catch (error) { next(error); }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// POST /api/auth/change-password
router.post('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) return res.status(400).json({ success: false, message: 'Invalid password' });
    const user = await db.findUserById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await db.updateUser(req.user.id, { password: hashedPassword });
    res.status(200).json({ success: true, message: 'Password changed' });
  } catch (error) { next(error); }
});

export default router;
