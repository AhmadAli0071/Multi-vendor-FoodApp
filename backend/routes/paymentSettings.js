import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { db } from '../config/database.js';

const router = express.Router();

// GET /api/payment-settings - Get payment numbers (admin only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const settings = await db.getPaymentSettings();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/payment-settings - Update payment numbers (admin only)
router.put('/', protect, adminOnly, async (req, res) => {
  try {
    const { jazzcash_number, jazzcash_name, easypaisa_number, easypaisa_name, bank_account, bank_name } = req.body;
    const updates = {};
    if (jazzcash_number !== undefined) updates.jazzcash_number = jazzcash_number;
    if (jazzcash_name !== undefined) updates.jazzcash_name = jazzcash_name;
    if (easypaisa_number !== undefined) updates.easypaisa_number = easypaisa_number;
    if (easypaisa_name !== undefined) updates.easypaisa_name = easypaisa_name;
    if (bank_account !== undefined) updates.bank_account = bank_account;
    if (bank_name !== undefined) updates.bank_name = bank_name;

    const settings = await db.updatePaymentSettings(updates);
    res.json({ success: true, message: 'Payment settings updated', settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
