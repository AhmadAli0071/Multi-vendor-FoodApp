import mongoose from 'mongoose';

const paymentProofSchema = new mongoose.Schema({
  restaurant_id: { type: String, required: true },
  restaurant_name: { type: String },
  amount: { type: Number, required: true },
  plan: { type: String },
  image: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  admin_note: { type: String, default: '' },
  months_to_add: { type: Number, default: 1 }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

paymentProofSchema.index({ restaurant_id: 1 });
paymentProofSchema.index({ status: 1 });

const PaymentProof = mongoose.model('PaymentProof', paymentProofSchema);
export default PaymentProof;
