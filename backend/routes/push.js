import express from 'express';
import PushSubscription from '../models/PushSubscription.js';

const router = express.Router();

// POST /api/push/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, type, restaurant_id, order_id } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription' });
    }
    if (!type || !['owner', 'customer'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });
    if (existing) {
      existing.subscription = subscription;
      existing.type = type;
      if (restaurant_id) existing.restaurant_id = restaurant_id;
      if (order_id) existing.order_id = order_id;
      await existing.save();
      return res.json({ success: true, message: 'Subscription updated' });
    }

    await PushSubscription.create({
      restaurant_id: restaurant_id || null,
      order_id: order_id || null,
      type,
      endpoint: subscription.endpoint,
      keys: subscription.keys || {},
      subscription
    });

    res.status(201).json({ success: true, message: 'Subscribed' });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/push/unsubscribe
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ success: false, message: 'Endpoint required' });
    await PushSubscription.deleteOne({ endpoint });
    res.json({ success: true, message: 'Unsubscribed' });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
