import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  restaurant_id: { type: String, required: true },
  type: { type: String, default: 'broadcast' },
  title: { type: String },
  body: { type: String },
  is_read: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

notificationSchema.index({ restaurant_id: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
