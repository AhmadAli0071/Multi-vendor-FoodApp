import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Broadcast from '../models/Broadcast.js';
import Notification from '../models/Notification.js';
import MenuItem from '../models/MenuItem.js';
import Customer from '../models/Customer.js';

class Database {
  // RESTAURANTS
  async findAllRestaurants(filters = {}) {
    const query = {};
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }
    if (filters.plan) query.plan = filters.plan;
    return Restaurant.find(query).sort({ created_at: -1 }).lean();
  }

  async findRestaurantById(id) {
    return Restaurant.findOne({ id }).lean();
  }

  async findRestaurantByEmail(email) {
    return Restaurant.findOne({ email }).lean();
  }

  async findRestaurantBySlug(slug) {
    return Restaurant.findOne({ slug }).lean();
  }

  async createRestaurant(data) {
    return Restaurant.create(data);
  }

  async updateRestaurant(id, updates) {
    return Restaurant.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  }

  async deleteRestaurant(id) {
    await Order.deleteMany({ restaurant_id: id });
    await User.deleteMany({ restaurant_id: id });
    await Payment.deleteMany({ restaurant_id: id });
    await Notification.deleteMany({ restaurant_id: id });
    await MenuItem.deleteMany({ restaurant_id: id });
    return Restaurant.findOneAndDelete({ id });
  }

  // ORDERS
  async findAllOrders(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.restaurant_id) query.restaurant_id = filters.restaurant_id;
    if (filters.date) {
      query.created_at = { $gte: new Date(filters.date), $lt: new Date(filters.date + 'T23:59:59Z') };
    }
    return Order.find(query).sort({ created_at: -1 }).lean();
  }

  async findOrderById(id) {
    return Order.findOne({ id }).lean();
  }

  async createOrder(data) {
    return Order.create(data);
  }

  async updateOrder(id, updates) {
    return Order.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  }

  // USERS
  async findUserByEmail(email) {
    return User.findOne({ email }).lean();
  }

  async findUserById(id) {
    return User.findOne({ id }).lean();
  }

  async createUser(data) {
    return User.create(data);
  }

  async updateUser(id, updates) {
    return User.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  }

  // PAYMENTS
  async createPayment(data) {
    return Payment.create(data);
  }

  async findPaymentsByRestaurantId(restaurantId) {
    return Payment.find({ restaurant_id: restaurantId }).sort({ payment_date: -1 }).lean();
  }

  // STATS
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1);

    const [totalRestaurants, activeOrders, todayOrders, monthlyOrders] = await Promise.all([
      Restaurant.countDocuments(),
      Order.countDocuments({ created_at: { $gte: today, $lt: tomorrow }, status: { $ne: 'delivered' } }),
      Order.countDocuments({ created_at: { $gte: today, $lt: tomorrow } }),
      Order.find({ created_at: { $gte: monthStart }, status: { $ne: 'delivered' } }).lean()
    ]);

    const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

    return {
      totalRestaurants,
      activeOrders,
      todayOrders,
      monthlyRevenue: Math.round(monthlyRevenue)
    };
  }

  // BROADCAST
  async createBroadcast(data) {
    return Broadcast.create(data);
  }

  async createNotification(data) {
    return Notification.create(data);
  }

  async getAudienceCount(type) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (type) {
      case 'all':
        return Restaurant.countDocuments({ active: true });
      case 'active':
        return Restaurant.countDocuments({ active: true, subscription_end: { $gte: today.toISOString().split('T')[0] } });
      case 'expiring': {
        const sevenDays = new Date(today);
        sevenDays.setDate(sevenDays.getDate() + 7);
        const endStr = sevenDays.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        return Restaurant.countDocuments({
          active: true,
          subscription_end: { $gte: todayStr, $lte: endStr }
        });
      }
      default:
        return 0;
    }
  }

  async getTargetRestaurants(type, selectedIds = []) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    let filter = {};
    switch (type) {
      case 'all':
        filter = { active: true };
        break;
      case 'active':
        filter = { active: true, subscription_end: { $gte: todayStr } };
        break;
      case 'expiring': {
        const sevenDays = new Date(today);
        sevenDays.setDate(sevenDays.getDate() + 7);
        filter = { active: true, subscription_end: { $gte: todayStr, $lte: sevenDays.toISOString().split('T')[0] } };
        break;
      }
      case 'specific':
        filter = { id: { $in: selectedIds } };
        break;
      default:
        return [];
    }
    return Restaurant.find(filter).lean();
  }

  // SUBSCRIPTIONS
  async getSubscriptionStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const sevenDays = new Date(today);
    sevenDays.setDate(sevenDays.getDate() + 7);
    const sevenStr = sevenDays.toISOString().split('T')[0];

    const [active, expiring, expired] = await Promise.all([
      Restaurant.countDocuments({ active: true, subscription_end: { $gte: todayStr } }),
      Restaurant.countDocuments({ active: true, subscription_end: { $gte: todayStr, $lte: sevenStr } }),
      Restaurant.countDocuments({ $or: [{ active: false }, { subscription_end: { $lt: todayStr } }] })
    ]);

    const activeRestaurants = await Restaurant.find({ active: true, subscription_end: { $gte: todayStr } }).lean();
    const planPrices = { Starter: 2999, Business: 5999, Premium: 9999 };
    const mrr = activeRestaurants.reduce((sum, r) => sum + (planPrices[r.plan] || 0), 0);

    return { active, expiring, expired, mrr };
  }

  // MENU ITEMS
  async findMenuItems(restaurantId) {
    return MenuItem.find({ restaurant_id: restaurantId }).sort({ sort_order: 1 }).lean();
  }

  async createMenuItem(data) {
    const count = await MenuItem.countDocuments({ restaurant_id: data.restaurant_id });
    return MenuItem.create({ ...data, sort_order: data.sort_order ?? count });
  }

  async updateMenuItem(id, updates) {
    return MenuItem.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  }

  async deleteMenuItem(id) {
    return MenuItem.findOneAndDelete({ id });
  }

  // CUSTOMERS
  async findCustomerByEmail(email) {
    return Customer.findOne({ email }).lean();
  }

  async findCustomerById(id) {
    return Customer.findOne({ id }).lean();
  }

  async findCustomerByPhone(phone) {
    return Customer.findOne({ phone }).lean();
  }

  async createCustomer(data) {
    return Customer.create(data);
  }

  async updateCustomer(id, updates) {
    return Customer.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  }

  async findOrdersByCustomerId(customerId) {
    return Order.find({ customer_id: customerId }).sort({ created_at: -1 }).lean();
  }
}

export const db = new Database();
