import express from 'express';
import { db } from '../config/database.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// POST /api/broadcast
router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { audienceType, restaurantIds, title, message } = req.body;
    let targetRestaurants = await db.getTargetRestaurants(audienceType, restaurantIds || []);
    await db.createBroadcast({ id: 'BC_' + Date.now(), title, message, audience_type: audienceType, target_count: targetRestaurants.length, sent_by: req.user.id });
    for (const restaurant of targetRestaurants) {
      await db.createNotification({ id: 'NOTIF_' + Date.now() + Math.random().toString(36).substr(2, 5), restaurant_id: restaurant.id, type: 'broadcast', title, body: message, is_read: false });
    }
    res.status(200).json({ success: true, message: `Broadcast sent to ${targetRestaurants.length} restaurant(s)`, sentTo: targetRestaurants.length });
  } catch (error) { next(error); }
});

// GET /api/broadcast/history
router.get('/history', protect, adminOnly, async (req, res, next) => {
  try {
    const Broadcast = (await import('../models/Broadcast.js')).default;
    const broadcasts = await Broadcast.find().sort({ created_at: -1 }).limit(50).lean();
    res.status(200).json({ success: true, broadcasts });
  } catch (error) { next(error); }
});

// GET /api/broadcast/audience-counts
router.get('/audience-counts', protect, adminOnly, async (req, res, next) => {
  try {
    const counts = {
      all: await db.getAudienceCount('all'),
      active: await db.getAudienceCount('active'),
      expiring: await db.getAudienceCount('expiring')
    };
    res.status(200).json({ success: true, counts });
  } catch (error) { next(error); }
});

export default router;
