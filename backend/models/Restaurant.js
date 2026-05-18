import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  image: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const menuCategorySchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '🍽️' },
  items: [menuItemSchema]
}, { _id: false });

const menuSchema = new mongoose.Schema({
  categories: [menuCategorySchema]
}, { _id: false });

const restaurantSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  address: { type: String, default: '' },
  primary_color: { type: String, default: '#FF6B35' },
  secondary_color: { type: String, default: '#FFFFFF' },
  font_family: { type: String, default: 'Poppins' },
  logo: { type: String, default: null },
  slug: { type: String, unique: true },
  delivery_available: { type: Boolean, default: true },
  pickup_available: { type: Boolean, default: true },
  opening_time: { type: String, default: '09:00' },
  closing_time: { type: String, default: '22:00' },
  estimated_delivery_time: { type: Number, default: 30 },
  min_order_amount: { type: Number, default: 0 },
  plan: { type: String, enum: ['Starter', 'Business', 'Premium'], default: 'Business' },
  subscription_start: { type: String },
  subscription_end: { type: String },
  active: { type: Boolean, default: true },
  menu: menuSchema
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, id: false });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;
