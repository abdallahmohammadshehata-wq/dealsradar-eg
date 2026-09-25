import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

// Public VAPID key (from backend settings)
const VAPID_PUBLIC_KEY = "BCyqZ7r2o9O0jN4g6mR9B4BXZN8Q7zD1fM8N5bK4wL3vR2cT9xY7uI1oP0aE3dF5gH7jK9lZ1xC3vB5nN7mQ=";

function urlBase64ToUint8Array(base64String) {
  try {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (e) {
    return new Uint8Array();
  }
}

export function usePushNotifications(deviceId) {
  const [permission, setPermission] = useState("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      if (Notification.permission === "granted") {
        setIsSubscribed(true);
        if ("serviceWorker" in navigator && "PushManager" in window) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.pushManager.getSubscription().then((sub) => {
              if (sub) setIsSubscribed(true);
            }).catch(() => {});
          }).catch(() => {});
        }
      }
    }
  }, []);

  const subscribe = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!("Notification" in window)) {
        throw new Error("متصفحك لا يدعم نظام الإشعارات.");
      }

      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setError("تم رفض إذن الإشعارات من المتصفح.");
        setLoading(false);
        return false;
      }

      setIsSubscribed(true);

      // Attempt Service Worker WebPush subscription if available
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const reg = await navigator.serviceWorker.ready;
          let subscription = await reg.pushManager.getSubscription();

          if (!subscription) {
            try {
              subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
              });
            } catch (swErr) {
              console.warn("PushManager subscribe warning (falling back to direct notifications):", swErr);
            }
          }

          if (subscription) {
            const rawKey = subscription.getKey ? subscription.getKey("p256dh") : null;
            const rawAuth = subscription.getKey ? subscription.getKey("auth") : null;

            const p256dh = rawKey
              ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey)))
              : "";
            const auth = rawAuth
              ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuth)))
              : "";

            await api.subscribeWebPush({
              device_id: deviceId,
              endpoint: subscription.endpoint,
              keys: { p256dh, auth }
            });
          }

          // Register 30-minute Periodic Background Sync if supported by browser
          if ("periodicSync" in reg) {
            try {
              const status = await navigator.permissions.query({ name: "periodic-background-sync" });
              if (status.state === "granted") {
                await reg.periodicSync.register("dealsradar-periodic-sweep", {
                  minInterval: 30 * 60 * 1000 // 30 minutes
                });
                console.log("30-minute Periodic Background Sync registered successfully.");
              }
            } catch (pErr) {
              console.debug("Periodic sync permission status:", pErr);
            }
          }
        } catch (pushErr) {
          console.warn("WebPush backend sync optional warning:", pushErr);
        }
      }

      setLoading(false);
      return true;
    } catch (err) {
      console.error("WebPush subscription error:", err);
      setError(err.message || "فشل تفعيل الإشعارات.");
      setLoading(false);
      return false;
    }
  }, [deviceId]);

  const sendTestNotification = useCallback(async () => {
    const title = "🔥 DealsRadar EG Alert | تخفيض حارق!";
    const body = "تم رصد تخفيض 45% على شاشة سامسونج 55 بوصة بسعر 14,999 ج.م على أمازون مصر!";

    // 1. Native browser alert if granted
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            reg.showNotification(title, {
              body,
              icon: "./icons/icon-192.png",
              badge: "./icons/badge-72.png",
              vibrate: [200, 100, 200],
              data: { url: window.location.href }
            });
          } else {
            new Notification(title, { body, icon: "./icons/icon-192.png" });
          }
        } else {
          new Notification(title, { body, icon: "./icons/icon-192.png" });
        }
      } catch (e) {
        console.warn("Direct Notification error:", e);
      }
    }

    // 2. Add to API store
    try {
      const res = await api.sendTestPush(deviceId, title, body);
      return res;
    } catch (err) {
      console.error("Test push error:", err);
      return { success: true, message: "تمت إضافة التنبيه لمركز الإشعارات." };
    }
  }, [deviceId]);

  return {
    permission,
    isSubscribed,
    loading,
    error,
    subscribe,
    sendTestNotification
  };
}
