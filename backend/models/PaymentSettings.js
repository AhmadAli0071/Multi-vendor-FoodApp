import mongoose from 'mongoose';

const paymentSettingsSchema = new mongoose.Schema({
  jazzcash_number: { type: String, default: '' },
  jazzcash_name: { type: String, default: 'JazzCash' },
  easypaisa_number: { type: String, default: '' },
  easypaisa_name: { type: String, default: 'EasyPaisa' },
  bank_account: { type: String, default: '' },
  bank_name: { type: String, default: '' }
}, { timestamps: true });

const PaymentSettings = mongoose.model('PaymentSettings', paymentSettingsSchema);
export default PaymentSettings;
