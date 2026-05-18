import fs from 'fs';
import path from 'path';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';

const seedDataPath = path.join(process.cwd(), 'data', 'db.json');

export const seedDatabase = async () => {
  try {
    console.log('🌱 Checking database seed data...');

    if (!fs.existsSync(seedDataPath)) {
      console.warn('⚠️  db.json not found at', seedDataPath);
      return;
    }

    const db = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));
    let seeded = false;

    // Seed restaurants (if none exist)
    const existingRestaurants = await Restaurant.countDocuments();
    if (existingRestaurants === 0 && (db.restaurants || []).length > 0) {
      for (const r of db.restaurants) {
        await Restaurant.create(r);
        console.log(`✅ Seeded restaurant: ${r.name}`);
      }
      seeded = true;
    } else {
      console.log(`✅ Restaurants already present (${existingRestaurants}).`);
    }

    // Seed users (if none exist)
    const existingUsers = await User.countDocuments();
    if (existingUsers === 0) {
      const usersToSeed = db.users || [];
      // If no explicit users array, create users from restaurants
      if (usersToSeed.length === 0) {
        for (const r of db.restaurants || []) {
          usersToSeed.push({
            id: `USER_${r.id}`,
            email: r.email,
            password: r.password,
            role: 'restaurant',
            restaurant_id: r.id
          });
        }
      }
      for (const u of usersToSeed) {
        await User.create(u);
        console.log(`✅ Seeded user: ${u.email}`);
      }
      seeded = true;
    } else {
      console.log(`✅ Users already present (${existingUsers}).`);
    }

    // Seed customers
    const existingCustomers = await Customer.countDocuments();
    if (existingCustomers === 0 && db.customers) {
      for (const c of db.customers) {
        await Customer.create(c);
        console.log(`✅ Seeded customer: ${c.name}`);
      }
      seeded = true;
    }

    // Seed orders
    const existingOrders = await Order.countDocuments();
    if (existingOrders === 0 && db.orders) {
      for (const o of db.orders) {
        await Order.create(o);
      }
      console.log(`✅ Seeded ${db.orders.length} orders`);
      seeded = true;
    }

    // Seed payments
    const existingPayments = await Payment.countDocuments();
    if (existingPayments === 0 && db.payments) {
      for (const p of db.payments) {
        await Payment.create(p);
      }
      console.log(`✅ Seeded ${db.payments.length} payments`);
      seeded = true;
    }

    // Seed menu items (if any)
    const existingMenuItems = await MenuItem.countDocuments();
    if (existingMenuItems === 0 && db.menu_items) {
      for (const item of db.menu_items) {
        await MenuItem.create(item);
      }
      console.log(`✅ Seeded ${db.menu_items.length} standalone menu items`);
      seeded = true;
    }

    if (seeded) {
      console.log('🎉 Database seeding completed!');
    } else {
      console.log('✅ Database already fully seeded, nothing to do.');
    }
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
};
