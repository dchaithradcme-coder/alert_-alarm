self.addEventListener('push', event => {
  const data = event.data.json();

  // Show the notification
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon
  });

  // Send message to all open clients for voice reminder
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'reminder',
        text: data.body
      });
    });
  });
});