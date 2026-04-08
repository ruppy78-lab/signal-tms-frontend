/* eslint-disable no-restricted-globals */
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : { title: 'Signal TMS', body: 'New notification' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/driver'));
});
