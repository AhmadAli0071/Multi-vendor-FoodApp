import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  restaurant_id: { type: String, required: true },
  plan: { type: String },
  amount: { type: Number, default: 0 },
  payment_method: { type: String, default: 'Cash' },
  transaction_id: { type: String, default: null },
  status: { type: String, default: 'completed' },
  payment_date: { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: false }, id: false });

paymentSchema.index({ restaurant_id: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
