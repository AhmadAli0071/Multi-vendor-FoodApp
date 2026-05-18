import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  restaurant_id: { type: String, required: true },
  category: { type: String, default: '' },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  image: { type: String, default: null },
  available: { type: Boolean, default: true },
  popular: { type: Boolean, default: false },
  sort_order: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, id: false });

menuItemSchema.index({ restaurant_id: 1 });
menuItemSchema.index({ category: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;
