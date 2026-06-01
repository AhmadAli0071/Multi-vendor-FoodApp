import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BMmVGxP6aL712oC-R3eHljkQMjq6YR-juomw8w1CYe1JIUwTMSvFKOXoH4TOmceyfhrkvEyoDwNI3xeX0iq1d0A';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'cDKjXYM3LsZHWVN-Am4VFgeyYfYK9uQsIQbt_56Uy24';

webpush.setVapidDetails(
  'mailto:notifications@foodapp.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

export async function sendPush(subscription, title, body, data = {}) {
  try {
    const payload = JSON.stringify({ title, body, ...data });
    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      if (subscription?.endpoint) {
        PushSubscription.deleteOne({ endpoint: subscription.endpoint }).catch(() => {});
      }
      return false;
    }
    console.error('Push send error:', err.message);
    return false;
  }
}
