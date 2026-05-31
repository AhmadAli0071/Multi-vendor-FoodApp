import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  restaurant_id: { type: String, required: true },
  customer_id: { type: String, default: null },
  customer_name: { type: String, required: true },
  customer_phone: { type: String, required: true },
  items: { type: mongoose.Schema.Types.Mixed },
  total: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  delivery_fee: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'], default: 'pending' },
  order_type: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
  address: { type: String, default: '' },
  notes: { type: String, default: '' },
  status_history: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, id: false });

orderSchema.index({ restaurant_id: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ customer_id: 1 });

// Update status and record history
orderSchema.methods.updateStatus = async function(newStatus) {
  this.status = newStatus;
  this.status_history.push({ status: newStatus, timestamp: new Date() });
  await this.save();
  return this;
};

const Order = mongoose.model('Order', orderSchema);
export default Order;
