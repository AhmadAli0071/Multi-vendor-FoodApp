import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  audience_type: { type: String },
  target_count: { type: Number, default: 0 },
  sent_by: { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

const Broadcast = mongoose.model('Broadcast', broadcastSchema);
export default Broadcast;
