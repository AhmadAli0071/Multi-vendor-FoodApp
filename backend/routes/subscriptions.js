import express from 'express';
import { db } from '../config/database.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const planPrices = { Starter: 2999, Business: 5999, Premium: 9999 };

// GET /api/subscriptions
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    let restaurants = await db.findAllRestaurants();
    const today = new Date();
    const enriched = restaurants.map(r => {
      const endDate = new Date(r.subscription_end);
      const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      return { ...r, subscriptionStart: r.subscription_start, subscriptionEnd: r.subscription_end, createdAt: r.created_at, daysLeft: Math.max(0, daysLeft) };
    });
    const stats = await db.getSubscriptionStats();
    res.status(200).json({ success: true, stats, restaurants: enriched });
  } catch (error) { next(error); }
});

// GET /api/subscriptions/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const restaurant = await db.findRestaurantById(id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    const today = new Date();
    const endDate = new Date(restaurant.subscription_end);
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    const payments = await db.findPaymentsByRestaurantId(id);
    res.status(200).json({ success: true, subscription: { ...restaurant, subscriptionStart: restaurant.subscription_start, subscriptionEnd: restaurant.subscription_end, createdAt: restaurant.created_at, daysLeft: Math.max(0, daysLeft), payments: payments.map(p => ({ ...p, amount: parseFloat(p.amount) })) } });
  } catch (error) { next(error); }
});

// POST /api/subscriptions/:id/renew
router.post('/:id/renew', protect, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params; const { months, paymentMethod } = req.body;
    if (!months || months < 1) return res.status(400).json({ success: false, message: 'Invalid renewal duration' });
    const restaurant = await db.findRestaurantById(id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    const currentEnd = new Date(restaurant.subscription_end);
    const newEnd = new Date(currentEnd); newEnd.setMonth(newEnd.getMonth() + parseInt(months));
    const newEndStr = newEnd.toISOString().split('T')[0];
    await db.updateRestaurant(id, { subscription_end: newEndStr, active: true });
    const price = planPrices[restaurant.plan] || 0;
    await db.createPayment({ id: 'PAY_' + Date.now(), restaurant_id: id, plan: restaurant.plan, amount: price * parseInt(months), payment_method: paymentMethod || 'Cash', status: 'completed', payment_date: new Date().toISOString().split('T')[0] });
    res.status(200).json({ success: true, message: `Subscription renewed for ${months} month(s)`, newEndDate: newEndStr, amountPaid: price * parseInt(months) });
  } catch (error) { next(error); }
});

// PUT /api/subscriptions/:id/change-plan
router.put('/:id/change-plan', protect, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params; const { newPlan } = req.body;
    if (!['Starter', 'Business', 'Premium'].includes(newPlan)) return res.status(400).json({ success: false, message: 'Invalid plan' });
    const updated = await db.updateRestaurant(id, { plan: newPlan });
    res.status(200).json({ success: true, message: 'Plan changed successfully', restaurant: updated });
  } catch (error) { next(error); }
});

export default router;
