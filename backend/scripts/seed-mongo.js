import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    Restaurant.deleteMany({}),
    User.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({})
  ]);

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const restaurants = [
    { id: '1', name: 'Al-Madina Fast Food', email: 'almadina@foodapp.pk', password: hashedPassword, phone: '0300-1234567', whatsapp: '923001234567', address: 'Food Street, Phase 4, Lahore', primary_color: '#FF6B35', secondary_color: '#FFFFFF', font_family: 'Poppins', slug: 'al-madina-fast-food', delivery_available: true, pickup_available: true, plan: 'Business', subscription_start: '2026-05-01', subscription_end: '2026-05-31', active: true, created_at: '2026-01-15T10:00:00Z' },
    { id: '2', name: 'Pizza Hub', email: 'pizzahub@foodapp.pk', password: hashedPassword, phone: '0301-9876543', whatsapp: '923019876543', address: 'Main Boulevard, Gulberg, Lahore', primary_color: '#E63946', secondary_color: '#F1FAEE', font_family: 'Inter', slug: 'pizza-hub', delivery_available: true, pickup_available: false, plan: 'Premium', subscription_start: '2026-04-15', subscription_end: '2026-05-15', active: true, created_at: '2026-02-20T14:30:00Z' },
    { id: '3', name: 'Broast Corner', email: 'broastcorner@foodapp.pk', password: hashedPassword, phone: '0302-5551234', whatsapp: '923025551234', address: 'Cantt Area, Karachi', primary_color: '#004E89', secondary_color: '#FFFFFF', font_family: 'Roboto', slug: 'broast-corner', delivery_available: true, pickup_available: true, plan: 'Starter', subscription_start: '2026-03-01', subscription_end: '2026-03-31', active: false, created_at: '2026-03-10T09:15:00Z' },
    { id: '4', name: 'Chai Wala', email: 'chaiwala@foodapp.pk', password: hashedPassword, phone: '0303-7778888', whatsapp: '923037778888', address: 'The Mall, Lahore', primary_color: '#06D6A0', secondary_color: '#1A1A2E', font_family: 'Noto Nastaliq Urdu', slug: 'chai-wala', delivery_available: false, pickup_available: true, plan: 'Business', subscription_start: '2026-04-01', subscription_end: '2026-04-30', active: true, created_at: '2026-04-05T11:45:00Z' },
    { id: '5', name: 'Biryani Mahal', email: 'biryanimahal@foodapp.pk', password: hashedPassword, phone: '0304-3332222', whatsapp: '923043332222', address: 'Saddar, Hyderabad', primary_color: '#FFD166', secondary_color: '#EF476F', font_family: 'Poppins', slug: 'biryani-mahal', delivery_available: true, pickup_available: true, plan: 'Premium', subscription_start: '2026-05-01', subscription_end: '2026-05-31', active: true, created_at: '2026-05-01T08:00:00Z' }
  ];

  await Restaurant.insertMany(restaurants);
  console.log('✓ Restaurants seeded');

  // Users
  const users = [
    { id: 'ADMIN001', email: 'admin@foodapp.pk', password: hashedPassword, role: 'admin', restaurant_id: null },
    { id: 'USER_1', email: 'almadina@foodapp.pk', password: hashedPassword, role: 'restaurant', restaurant_id: '1' },
    { id: 'USER_2', email: 'pizzahub@foodapp.pk', password: hashedPassword, role: 'restaurant', restaurant_id: '2' },
    { id: 'USER_3', email: 'broastcorner@foodapp.pk', password: hashedPassword, role: 'restaurant', restaurant_id: '3' },
    { id: 'USER_4', email: 'chaiwala@foodapp.pk', password: hashedPassword, role: 'restaurant', restaurant_id: '4' },
    { id: 'USER_5', email: 'biryanimahal@foodapp.pk', password: hashedPassword, role: 'restaurant', restaurant_id: '5' }
  ];
  await User.insertMany(users);
  console.log('✓ Users seeded');

  // Orders
  const orders = [
    { id: 'ORD-001', restaurant_id: '1', customer_name: 'Ahmed Hassan', customer_phone: '0300-1112233', items: [{ name: 'Chicken Burger', qty: 2, price: 350 }, { name: 'Fries', qty: 1, price: 200 }, { name: 'Coke', qty: 1, price: 150 }], total: 1250, status: 'pending', order_type: 'delivery', created_at: '2026-05-04T08:30:00Z' },
    { id: 'ORD-002', restaurant_id: '2', customer_name: 'Sana Tariq', customer_phone: '0301-4445566', items: [{ name: 'Pepperoni Pizza', qty: 1, price: 1800 }, { name: 'Garlic Bread', qty: 2, price: 300 }], total: 2400, status: 'accepted', order_type: 'delivery', created_at: '2026-05-04T08:45:00Z' },
    { id: 'ORD-003', restaurant_id: '1', customer_name: 'Ali Raza', customer_phone: '0302-7778899', items: [{ name: 'Broast Chicken', qty: 3, price: 500 }, { name: 'Coleslaw', qty: 1, price: 390 }], total: 1890, status: 'preparing', order_type: 'pickup', created_at: '2026-05-04T09:00:00Z' },
    { id: 'ORD-004', restaurant_id: '4', customer_name: 'Fatima Khan', customer_phone: '0303-9990000', items: [{ name: 'Chai', qty: 5, price: 50 }, { name: 'Samosas', qty: 2, price: 100 }], total: 450, status: 'ready', order_type: 'pickup', created_at: '2026-05-04T09:15:00Z' },
    { id: 'ORD-005', restaurant_id: '5', customer_name: 'Hassan Mehmood', customer_phone: '0304-1234567', items: [{ name: 'Chicken Biryani', qty: 1, price: 600 }, { name: 'Raita', qty: 1, price: 150 }], total: 750, status: 'delivered', order_type: 'delivery', created_at: '2026-05-04T07:30:00Z' },
    { id: 'ORD-006', restaurant_id: '2', customer_name: 'Ayesha Siddique', customer_phone: '0301-8765432', items: [{ name: 'Veggie Pizza', qty: 1, price: 1200 }, { name: 'Coke', qty: 1, price: 150 }], total: 1350, status: 'pending', order_type: 'delivery', created_at: new Date().toISOString() },
    { id: 'ORD-007', restaurant_id: '4', customer_name: 'Usman Ali', customer_phone: '0303-4567890', items: [{ name: 'Paratha', qty: 3, price: 100 }, { name: 'Omelette', qty: 2, price: 150 }], total: 600, status: 'accepted', order_type: 'pickup', created_at: new Date().toISOString() },
    { id: 'ORD-008', restaurant_id: '5', customer_name: 'Zainab Abbas', customer_phone: '0304-9876543', items: [{ name: 'Beef Biryani', qty: 2, price: 700 }, { name: 'Salad', qty: 1, price: 200 }], total: 1600, status: 'preparing', order_type: 'delivery', created_at: new Date().toISOString() }
  ];
  await Order.insertMany(orders);
  console.log('✓ Orders seeded');

  // Payments
  const payments = [
    { id: 'PAY_1', restaurant_id: '1', plan: 'Business', amount: 5999, payment_method: 'Cash', status: 'completed', payment_date: '2026-05-01' },
    { id: 'PAY_2', restaurant_id: '2', plan: 'Premium', amount: 9999, payment_method: 'Cash', status: 'completed', payment_date: '2026-04-15' },
    { id: 'PAY_3', restaurant_id: '3', plan: 'Starter', amount: 2999, payment_method: 'Cash', status: 'completed', payment_date: '2026-03-01' },
    { id: 'PAY_4', restaurant_id: '4', plan: 'Business', amount: 5999, payment_method: 'Cash', status: 'completed', payment_date: '2026-04-01' },
    { id: 'PAY_5', restaurant_id: '5', plan: 'Premium', amount: 9999, payment_method: 'Cash', status: 'completed', payment_date: '2026-05-01' }
  ];
  await Payment.insertMany(payments);
  console.log('✓ Payments seeded');

  console.log('\n✅ Database seeded successfully!');
  console.log('Admin login: admin@foodapp.pk / admin123');
  console.log('Restaurant login: pizzahub@foodapp.pk / admin123');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
