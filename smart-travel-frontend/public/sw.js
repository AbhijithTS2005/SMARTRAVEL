const CACHE_NAME = 'smartravel-v2';
const OFFLINE_URL = '/offline.html';

// Assets to pre-cache on install
const PRE_CACHE = [
  OFFLINE_URL,
  '/icon.svg',
];

// Install — pre-cache offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRE_CACHE))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network-first with offline fallback for navigations
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (
          event.request.method === 'GET' &&
          response.status === 200 &&
          (event.request.url.includes('/icon') || event.request.url.includes('.svg'))
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

/* ═══════════════════════════════════════════════════════
   PUSH NOTIFICATIONS
   ═══════════════════════════════════════════════════════ */

// Notification type → icon & color mapping
const NOTIFICATION_CONFIG = {
  weather_alert:        { icon: '⛈️', badge: 'Weather Alert',         tag: 'weather' },
  aqi_warning:          { icon: '🌫️', badge: 'Air Quality Warning',   tag: 'aqi' },
  disaster_alert:       { icon: '🚨', badge: 'EMERGENCY',             tag: 'disaster' },
  travel_season:        { icon: '🌴', badge: 'Travel Season',         tag: 'season' },
  recommendation_update:{ icon: '🎯', badge: 'Recommendation',        tag: 'recommendation' },
  new_match:            { icon: '✨', badge: 'New Match',              tag: 'match' },
  general:              { icon: '💡', badge: 'Smart Travel',           tag: 'general' },
};

// Handle incoming push events
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'SmarTravel',
      body: event.data.text(),
      type: 'general',
    };
  }

  const config = NOTIFICATION_CONFIG[data.type] || NOTIFICATION_CONFIG.general;

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon.svg',
    badge: '/icon.svg',
    tag: config.tag + '-' + Date.now(), // unique tag to avoid overwriting
    renotify: true,
    vibrate: [200, 100, 200, 100, 200], // vibration pattern for mobile
    data: {
      url: data.url || '/notifications',
      type: data.type,
      timestamp: data.timestamp || new Date().toISOString(),
    },
    actions: [
      {
        action: 'view',
        title: '👁️ View',
      },
      {
        action: 'dismiss',
        title: '✖️ Dismiss',
      },
    ],
    // Auto-close after 30 seconds on desktop
    requireInteraction: data.type === 'disaster_alert' || data.type === 'weather_alert',
    silent: false,
  };

  // For disaster alerts, make the notification persistent and urgent
  if (data.type === 'disaster_alert') {
    options.vibrate = [500, 200, 500, 200, 500, 200, 500];
    options.requireInteraction = true;
    options.tag = 'disaster-urgent';
    options.renotify = true;
  }

  event.waitUntil(
    self.registration.showNotification(
      `${config.icon} ${data.title || 'SmarTravel'}`,
      options
    )
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data;

  // If dismissed, just close
  if (action === 'dismiss') return;

  // Navigate to the URL from the notification payload
  const urlToOpen = notificationData?.url || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open with the app
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // No window open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close (analytics)
self.addEventListener('notificationclose', (event) => {
  // Could send analytics here in the future
  console.log('[SW] Notification closed:', event.notification.data?.type);
});
