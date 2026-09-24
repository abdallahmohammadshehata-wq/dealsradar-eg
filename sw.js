const CACHE_NAME = "dealsradar-eg-v1.1.0";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./offline.html",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/badge-72.png"
];

// Install Event: pre-cache static app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("ServiceWorker pre-cache warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: network-first for API, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API Requests: Network first, fall back to offline cache
  if (url.pathname.includes("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Navigation requests (HTML)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("./index.html") || caches.match("./offline.html");
      })
    );
    return;
  }

  // Static assets: Cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          if (response.status === 200 && event.request.method === "GET") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
      );
    })
  );
});

// Push Event: Handle incoming WebPush notifications
self.addEventListener("push", (event) => {
  let data = {
    title: "🔥 صفقات رادار مصر | DealsRadar EG",
    body: "تم رصد تخفيض قوي على منتج تتابعه!",
    icon: "./icons/icon-192.png",
    badge: "./icons/badge-72.png",
    data: { url: "./" }
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "./icons/icon-192.png",
    badge: data.badge || "./icons/badge-72.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "dealsradar-alert",
    renotify: true,
    data: data.data || { url: "./" },
    actions: [
      { action: "explore", title: "🛒 افتح العرض (Open Deal)" },
      { action: "dismiss", title: "✕ إغلاق (Dismiss)" }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification Click Event: Focus or Open deep link
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || "./";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
