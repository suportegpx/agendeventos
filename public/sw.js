self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/favicon.ico', // Ícone que aparece na notificação
      vibrate: [200, 100, 200, 100, 200], // Faz o celular vibrar
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  // Quando o técnico clicar na notificação, abre o site
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});