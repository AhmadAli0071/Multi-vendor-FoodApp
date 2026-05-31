import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
  restaurant_id: { type: String, default: null },
  order_id: { type: String, default: null },
  type: { type: String, enum: ['owner', 'customer'], required: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String },
    auth: { type: String }
  },
  subscription: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

pushSubscriptionSchema.index({ restaurant_id: 1 });
pushSubscriptionSchema.index({ order_id: 1 });
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
export default PushSubscription;
