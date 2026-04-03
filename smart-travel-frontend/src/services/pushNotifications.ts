import api from './api';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

/**
 * Convert a URL-safe base64 string to Uint8Array (for applicationServerKey).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current notification permission status.
 */
export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Check if the user is currently subscribed to push.
 */
export async function isSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

/**
 * Subscribe to push notifications.
 * Returns true if subscription was successful.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported in this browser');
    return false;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('VAPID public key not configured');
    return false;
  }

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });
    }

    // Send subscription to backend
    const subscriptionJson = subscription.toJSON();

    await api.post('/push-subscription', {
      endpoint: subscriptionJson.endpoint,
      keys: {
        p256dh: subscriptionJson.keys?.p256dh,
        auth: subscriptionJson.keys?.auth,
      },
      content_encoding: (PushManager.supportedContentEncodings || ['aesgcm'])[0],
    });

    console.log('✅ Push subscription saved successfully');
    return true;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return false;
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Remove from backend
      try {
        await api.delete('/push-subscription', {
          data: { endpoint: subscription.endpoint },
        });
      } catch {
        // Backend cleanup failure is non-critical
      }

      // Unsubscribe locally
      await subscription.unsubscribe();
    }

    console.log('✅ Push subscription removed');
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
    return false;
  }
}

/**
 * Send a test push notification via the backend.
 */
export async function sendTestNotification(): Promise<boolean> {
  try {
    const response = await api.post('/push-test');
    return response.data?.success ?? false;
  } catch (error) {
    console.error('Test notification failed:', error);
    return false;
  }
}
