import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

// Public VAPID key (from backend settings)
const VAPID_PUBLIC_KEY = "BCyqZ7r2o9O0jN4g6mR9B4BXZN8Q7zD1fM8N5bK4wL3vR2cT9xY7uI1oP0aE3dF5gH7jK9lZ1xC3vB5nN7mQ=";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(deviceId) {
  const [permission, setPermission] = useState("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      if (Notification.permission === "granted" && "serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.pushManager.getSubscription().then((sub) => {
            setIsSubscribed(!!sub);
          });
        });
      }
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setError("Push notifications are not supported in this browser.");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setError("Notification permission was denied.");
        setLoading(false);
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        // Subscribe to browser push service
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      const rawKey = subscription.getKey ? subscription.getKey("p256dh") : null;
      const rawAuth = subscription.getKey ? subscription.getKey("auth") : null;

      const p256dh = rawKey
        ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey)))
        : "";
      const auth = rawAuth
        ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuth)))
        : "";

      // Send to backend
      await api.subscribeWebPush({
        device_id: deviceId,
        endpoint: subscription.endpoint,
        keys: { p256dh, auth }
      });

      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (err) {
      console.error("WebPush subscription error:", err);
      setError(err.message || "Failed to enable push notifications.");
      setLoading(false);
      return false;
    }
  }, [deviceId]);

  const sendTestNotification = useCallback(async () => {
    try {
      const res = await api.sendTestPush(
        deviceId,
        "🔥 DealsRadar EG Alert | تخفيض حارق!",
        "تم رصد تخفيض 45% على شاشة سامسونج 55 بوصة بسعر 14,999 ج.م!"
      );
      return res;
    } catch (err) {
      console.error("Test push failed:", err);
      throw err;
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
