import twilio from 'twilio';

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER
} = process.env;

let client;

const getClient = () => {
  if (!client && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return client;
};

export const sendWhatsApp = async (toPhoneNumber, message) => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    console.warn('Twilio config missing. WhatsApp notifications disabled.');
    return { success: false, message: 'WhatsApp not configured' };
  }

  const clientInstance = getClient();
  if (!clientInstance) {
    return { success: false, message: 'Twilio client not initialized' };
  }

  try {
    // Ensure phone number is in E.164 format
    const formattedNumber = toPhoneNumber.startsWith('+') ? toPhoneNumber : `+${toPhoneNumber}`;

    const messageInstance = await clientInstance.messages.create({
      body: message,
      from: `whatsapp:${TWILIO_FROM_NUMBER}`,
      to: `whatsapp:${formattedNumber}`
    });

    console.log('WhatsApp message sent:', messageInstance.sid);
    return { success: true, sid: messageInstance.sid };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
};

export const sendNewOrderWhatsApp = async (order, restaurant) => {
  const orderId = order.id?.slice(-6);
  const itemsList = order.items?.map(i => `• ${i.name} x${i.quantity} = PKR ${i.price * i.quantity}`).join('\n') || 'No items';
  const total = order.total;

  const message = `
🍕 *New Order #${orderId}*

*Restaurant:* ${restaurant?.name || 'Your Restaurant'}

*Customer:* ${order.customer_name}
*Phone:* ${order.customer_phone}
*Type:* ${order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}
${order.address ? `*Address:* ${order.address}` : ''}

*Items:*
${itemsList}

*Total:* PKR ${total}

👉 Check your admin dashboard for details.
${process.env.APP_URL || 'http://localhost:5173'}/owner/orders
  `.trim();

  // Send to restaurant's WhatsApp number if available, else phone
  const phone = restaurant?.whatsapp || restaurant?.phone;
  if (phone) {
    return sendWhatsApp(phone, message);
  }

  console.warn('No phone number for restaurant. WhatsApp not sent.');
  return { success: false, message: 'No phone number' };
};
