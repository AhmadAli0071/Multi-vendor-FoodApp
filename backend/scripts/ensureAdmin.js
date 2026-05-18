import User from '../models/User.js';

export const ensureAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@foodapp.pk';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existing = await User.findOne({ email: adminEmail, role: 'admin' });
    if (existing) return;

    const bcrypt = await import('bcryptjs');
    const hashed = await bcrypt.default.hash(adminPassword, 10);

    await User.create({
      id: 'ADMIN001',
      email: adminEmail,
      password: hashed,
      role: 'admin',
      restaurant_id: null
    });

    console.log(`Admin user created: ${adminEmail}`);
  } catch (err) {
    console.error('Failed to create admin user:', err.message);
  }
};
