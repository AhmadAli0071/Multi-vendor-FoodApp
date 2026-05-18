import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  FROM_EMAIL,
  FROM_NAME,
  APP_URL
} = process.env;

let transporter;

const createTransporter = () => {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn('Email config missing. Email sending disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: parseInt(SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
};

export const sendEmail = async (to, subject, html, text = '') => {
  if (!FROM_EMAIL || !FROM_NAME) {
    console.warn('FROM_EMAIL or FROM_NAME missing. Email not sent.');
    return { success: false, message: 'Email not configured' };
  }

  transporter ??= createTransporter();

  if (!transporter) {
    return { success: false, message: 'Email transport not available' };
  }

  try {
    const info = await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      text,
      html
    });
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

export const sendOrderStatusEmail = async (order, restaurant, customer) => {
  const statusLabels = {
    pending: 'Order Placed',
    confirmed: 'Order Confirmed',
    preparing: 'Preparing',
    ready: 'Ready for Delivery/Pickup',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };

  const statusEmojis = {
    pending: '📋',
    confirmed: '✅',
    preparing: '👨‍🍳',
    ready: '📦',
    out_for_delivery: '🚚',
    delivered: '🎉',
    cancelled: '❌'
  };

  const statusLabel = statusLabels[order.status] || order.status;
  const emoji = statusEmojis[order.status] || '📌';

  const subject = `${emoji} Order #${order.id?.slice(-6)} - ${statusLabel}`;

  const orderItemsHtml = order.items?.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">PKR ${item.price * item.quantity}</td>
    </tr>
  `).join('') || '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background: #FF6B35; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Order Update</h1>
      </div>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px;">Hi ${customer?.name || 'Customer'},</p>
        <p>Your order <strong>#${order.id?.slice(-6)}</strong> status has been updated to:</p>
        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #FF6B35;">
          <h2 style="color: #FF6B35; margin: 0; font-size: 20px;">${emoji} ${statusLabel}</h2>
        </div>
        <h3 style="color: #555;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
          <thead style="background: #FF6B35; color: white;">
            <tr>
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: right;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>${orderItemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold;">PKR ${order.total}</td>
            </tr>
          </tfoot>
        </table>
        <p style="margin-top: 20px;"><strong>Delivery Type:</strong> ${order.deliveryType || 'Pickup'}</p>
        ${order.deliveryAddress ? `<p><strong>Address:</strong> ${order.deliveryAddress}</p>` : ''}
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          Thank you for ordering from <strong>${restaurant?.name || 'us'}!</strong>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">
          © ${new Date().getFullYear()} ${FROM_NAME}. All rights reserved.<br>
          ${APP_URL}
        </p>
      </div>
    </div>
  `;

  const text = `${orderItemsHtml ? 'Order Items:\n' + orderItemsHtml : ''}
Order #${order.id?.slice(-6)} - Status: ${statusLabel}
Total: PKR ${order.total}
View your order: ${APP_URL}/customer/account`;

  return sendEmail(customer?.email || order.customerEmail, subject, html, text);
};

export const sendNewOrderNotificationToRestaurant = async (order, restaurant) => {
  const subject = `🔔 New Order #${order.id?.slice(-6)} Received!`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background: #28a745; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">New Order Alert</h1>
      </div>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px;">Hello ${restaurant?.name || 'Restaurant'},</p>
        <p>You have received a new order!</p>
        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #28a745;">
          <h2 style="color: #28a745; margin: 0; font-size: 20px;">Order #${order.id?.slice(-6)}</h2>
          <p><strong>Customer:</strong> ${order.customerName}</p>
          <p><strong>Phone:</strong> ${order.customerPhone}</p>
          <p><strong>Type:</strong> ${order.deliveryType}</p>
          ${order.deliveryAddress ? `<p><strong>Address:</strong> ${order.deliveryAddress}</p>` : ''}
        </div>
        <p>Please check your owner dashboard to manage this order.</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${APP_URL}/owner/orders" style="background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Orders</a>
        </div>
      </div>
    </div>
  `;

  const text = `New Order #${order.id?.slice(-6)}
Customer: ${order.customerName}
Phone: ${order.customerPhone}
Type: ${order.deliveryType}
Total: PKR ${order.total}`;

  // Get restaurant email from DB or fallback
  return sendEmail(restaurant?.email || process.env.ADMIN_EMAIL, subject, html, text);
};
