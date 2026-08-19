self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "Fazlaka", body: "", url: "/" };
  try {
    const data = event.data ? event.data.json() : {};
    payload = { title: data.title || "Fazlaka", body: data.body || "", url: data.url || "/" };
  } catch {
    payload = { title: "Fazlaka", body: event.data ? event.data.text() : "", url: "/" };
  }
  const options = {
    body: payload.body,
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    data: { url: payload.url },
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});
