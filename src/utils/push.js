const API_BASE = import.meta.env.VITE_API_URL || '';

export async function getVapidPublicKey() {
  try {
    const res = await fetch(`${API_BASE}/api/push/vapid-public-key`);
    const data = await res.json();
    return data.publicKey || null;
  } catch {
    return null;
  }
}

export async function registerPushSubscription(type, identifier) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push not supported');
    return null;
  }

  try {
    const publicKey = await getVapidPublicKey();
    if (!publicKey) {
      console.log('No VAPID key available');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
    }

    const body = {
      subscription: subscription.toJSON(),
      type
    };

    if (type === 'owner') {
      body.restaurant_id = identifier;
    } else if (type === 'customer') {
      body.order_id = identifier;
    }

    const res = await fetch(`${API_BASE}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    return data.success ? subscription : null;
  } catch (err) {
    console.error('Push registration error:', err);
    return null;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}
