import express from 'express';
import { protect } from '../middleware/auth.js';
import PaymentProof from '../models/PaymentProof.js';
import { db } from '../config/database.js';

const router = express.Router();

const planPrices = { Starter: 2999, Business: 5999, Premium: 9999 };

// PUBLIC: GET /api/payment-proofs/lookup/:paymentId - Search restaurant by payment ID
router.get('/lookup/:paymentId', async (req, res) => {
  try {
    const restaurant = await db.findRestaurantByPaymentId(req.params.paymentId.toUpperCase());
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Invalid Payment ID. Restaurant not found.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const endDate = restaurant.subscription_end || '';
    const isExpired = endDate < today || !restaurant.active;
    const daysLeft = endDate ? Math.ceil((new Date(endDate) - new Date()) / 86400000) : 0;
    const planPrice = planPrices[restaurant.plan] || 5999;

    const paymentSettings = await db.getPaymentSettings();

    res.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        payment_id: restaurant.payment_id,
        plan: restaurant.plan,
        subscription_end: endDate,
        is_expired: isExpired,
        days_left: Math.max(0, daysLeft),
        active: restaurant.active,
        amount_due: planPrice
      },
      payment_methods: {
        jazzcash: paymentSettings.jazzcash_number || '',
        jazzcash_name: paymentSettings.jazzcash_name || 'JazzCash',
        easypaisa: paymentSettings.easypaisa_number || '',
        easypaisa_name: paymentSettings.easypaisa_name || 'EasyPaisa',
        bank_account: paymentSettings.bank_account || '',
        bank_name: paymentSettings.bank_name || ''
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUBLIC: POST /api/payment-proofs/public - Upload payment proof (no auth)
router.post('/public', async (req, res) => {
  try {
    const { payment_id, amount, plan, payment_method, image } = req.body;
    if (!payment_id || !amount || !image) {
      return res.status(400).json({ success: false, message: 'Payment ID, amount, and screenshot are required' });
    }

    const restaurant = await db.findRestaurantByPaymentId(payment_id.toUpperCase());
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const price = planPrices[plan || restaurant.plan] || 5999;
    const monthsToAdd = Math.max(1, Math.floor(parseFloat(amount) / price));

    await PaymentProof.create({
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      payment_id: payment_id.toUpperCase(),
      amount: parseFloat(amount),
      plan: plan || restaurant.plan,
      payment_method: payment_method || '',
      image,
      status: 'pending',
      months_to_add: monthsToAdd
    });

    res.status(201).json({
      success: true,
      message: 'Payment proof submitted! Admin will verify and update your subscription.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/payment-proofs - Restaurant owner uploads payment proof
router.post('/', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'restaurant') {
      return res.status(403).json({ success: false, message: 'Only restaurant owners can upload' });
    }

    const { amount, image, plan } = req.body;
    if (!amount || !image) {
      return res.status(400).json({ success: false, message: 'Amount and screenshot are required' });
    }

    const restaurant = await db.findRestaurantById(req.user.restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const price = planPrices[plan || restaurant.plan] || 5999;
    const monthsToAdd = Math.max(1, Math.floor(parseFloat(amount) / price));

    await PaymentProof.create({
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      amount: parseFloat(amount),
      plan: plan || restaurant.plan,
      image,
      status: 'pending',
      months_to_add: monthsToAdd
    });

    res.status(201).json({ success: true, message: 'Payment proof uploaded. Waiting for admin approval.' });
  } catch (error) { next(error); }
});

// GET /api/payment-proofs/pending - Admin gets pending proofs
router.get('/pending', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    const proofs = await PaymentProof.find({ status: 'pending' }).sort({ created_at: -1 }).lean();
    res.status(200).json({ success: true, proofs });
  } catch (error) { next(error); }
});

// GET /api/payment-proofs/history - Admin gets all proofs
router.get('/history', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    const proofs = await PaymentProof.find().sort({ created_at: -1 }).limit(50).lean();
    res.status(200).json({ success: true, proofs });
  } catch (error) { next(error); }
});

// PUT /api/payment-proofs/:id/approve - Admin approves + auto-renews
router.put('/:id/approve', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const proof = await PaymentProof.findById(req.params.id);
    if (!proof) {
      return res.status(404).json({ success: false, message: 'Proof not found' });
    }
    if (proof.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Already processed' });
    }

    // Auto-Renew: extend subscription
    const restaurant = await db.findRestaurantById(proof.restaurant_id);
    if (restaurant) {
      const currentEnd = new Date(restaurant.subscription_end || new Date());
      if (currentEnd < new Date()) {
        currentEnd.setTime(Date.now());
      }
      currentEnd.setMonth(currentEnd.getMonth() + proof.months_to_add);
      const newEnd = currentEnd.toISOString().split('T')[0];

      await db.updateRestaurant(proof.restaurant_id, {
        subscription_end: newEnd,
        active: true
      });

      // Create payment record
      await db.createPayment({
        id: 'PAY_' + Date.now(),
        restaurant_id: proof.restaurant_id,
        plan: proof.plan || restaurant.plan,
        amount: proof.amount,
        payment_method: 'Bank Transfer',
        status: 'completed',
        payment_date: new Date().toISOString().split('T')[0]
      });
    }

    proof.status = 'approved';
    proof.admin_note = req.body.note || 'Approved';
    await proof.save();

    res.status(200).json({
      success: true,
      message: `Payment approved. Subscription extended by ${proof.months_to_add} month(s).`
    });
  } catch (error) { next(error); }
});

// PUT /api/payment-proofs/:id/reject - Admin rejects
router.put('/:id/reject', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const proof = await PaymentProof.findById(req.params.id);
    if (!proof) {
      return res.status(404).json({ success: false, message: 'Proof not found' });
    }
    if (proof.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Already processed' });
    }

    proof.status = 'rejected';
    proof.admin_note = req.body.note || 'Rejected';
    await proof.save();

    res.status(200).json({ success: true, message: 'Payment proof rejected.' });
  } catch (error) { next(error); }
});

export default router;
