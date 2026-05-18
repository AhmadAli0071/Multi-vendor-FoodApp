import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  id: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'restaurant', 'customer'], default: 'restaurant' },
  restaurant_id: { type: String, default: null }
}, { timestamps: { createdAt: 'created_at', updatedAt: false }, id: false });

userSchema.index({ role: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$') || this.password.startsWith('$2y$')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;
