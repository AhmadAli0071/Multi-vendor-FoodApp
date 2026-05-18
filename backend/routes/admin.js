import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.findUserByEmail(email);
  if (!user || user.role !== 'admin') return res.status(401).json({ success: false, message: 'Invalid credentials' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });
  res.json({ success: true, token, user: { id: user.id, email: user.email, role: 'admin' } });
});

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', protect, adminOnly, async (req, res) => {
  try {
    const stats = await db.getStats();
    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
