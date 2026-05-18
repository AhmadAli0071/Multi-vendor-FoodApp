import Restaurant from '../models/Restaurant.js';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const generatePaymentId = async () => {
  let paymentId;
  let exists = true;
  while (exists) {
    const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const digits = Math.floor(1000 + Math.random() * 9000).toString();
    paymentId = `${letter}${digits}`;
    exists = await Restaurant.findOne({ payment_id: paymentId });
  }
  return paymentId;
};
