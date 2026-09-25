const CACHE_NAME = "dealsradar-eg-v2.0.0-mobile-viewport-fix";
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

// Install Event: pre-cache static app shell and skip waiting immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("ServiceWorker pre-cache warning:", err);
      });
    })
  );
});

// Activate Event: immediately clean ALL old caches and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Purging old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
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

// ═══════════════════════════════════════════════════════════════════════════════
// Periodic Background Sync: Wakes up every 30 mins even when tab is closed
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "dealsradar-periodic-sweep" || event.tag === "dealsradar-30min-sweep") {
    event.waitUntil(
      fetch("./api/v1/deals?limit=25")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          const deals = data.items || data || [];
          const hotDeals = deals.filter((d) => (d.discount_percent || 0) >= 35);
          if (hotDeals.length > 0) {
            const top = hotDeals[0];
            return self.registration.showNotification(
              `⚡ رادار الصفقات (تحديث الـ 30 دقيقة): خصم ${top.discount_percent}%!`,
              {
                body: `${top.title.slice(0, 80)} أصبح بسعر ${top.current_price} ج.م على ${top.store_name}`,
                icon: top.image_url || "./icons/icon-192.png",
                badge: "./icons/badge-72.png",
                tag: `periodic-deal-${top.id || Math.floor(Math.random() * 1000)}`,
                renotify: false,
                data: { url: top.url || "./" }
              }
            );
          }
        })
        .catch((err) => console.debug("Periodic sync background sweep note:", err))
    );
  }
});

// Background Sync on Reconnection
self.addEventListener("sync", (event) => {
  if (event.tag === "dealsradar-sync-alerts") {
    event.waitUntil(
      fetch("./api/v1/alerts/notifications")
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
    );
  }
});
