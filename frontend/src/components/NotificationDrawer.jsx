import React, { useState, useEffect } from "react";
import { 
  Bell, 
  X, 
  CheckCheck, 
  ExternalLink, 
  Sparkles, 
  ShoppingBag, 
  Send, 
  Trash2, 
  Volume2,
  AlertCircle,
  Zap
} from "lucide-react";
import { api, getLiveDealUrl } from "../api/client";

export function NotificationDrawer({ isOpen, onClose, deviceId, onNotificationCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testSending, setTestSending] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, deviceId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications(deviceId);
      setNotifications(data || []);
      const unread = (data || []).filter(n => !n.is_read).length;
      if (onNotificationCountChange) onNotificationCountChange(unread);
    } catch (e) {}
    setLoading(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead(deviceId);
      const updated = notifications.map(n => ({ ...n, is_read: true }));
      setNotifications(updated);
      if (onNotificationCountChange) onNotificationCountChange(0);
    } catch (e) {}
  };

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      const updated = notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
      setNotifications(updated);
      const unread = updated.filter(n => !n.is_read).length;
      if (onNotificationCountChange) onNotificationCountChange(unread);
    } catch (e) {}
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(id, deviceId);
      const updated = notifications.filter(n => n.id !== id);
      setNotifications(updated);
      const unread = updated.filter(n => !n.is_read).length;
      if (onNotificationCountChange) onNotificationCountChange(unread);
    } catch (e) {}
  };

  const handleClearAll = async () => {
    try {
      await api.clearAllNotifications(deviceId);
      setNotifications([]);
      if (onNotificationCountChange) onNotificationCountChange(0);
    } catch (e) {}
  };

  const handleSendTestNotification = async () => {
    setTestSending(true);
    try {
      // 1. Trigger Native Web Browser Notification if permission granted
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          if ("serviceWorker" in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
              reg.showNotification("🔥 DealsRadar EG Alert | تخفيض حارق!", {
                body: "تم رصد تخفيض 45% على شاشة سامسونج 55 بوصة بسعر 14,999 ج.م!",
                icon: "./icons/icon-192.png",
                badge: "./icons/badge-72.png",
                vibrate: [200, 100, 200],
                data: { url: window.location.href }
              });
            } else {
              new Notification("🔥 DealsRadar EG Alert | تخفيض حارق!", {
                body: "تم رصد تخفيض 45% على شاشة سامسونج 55 بوصة بسعر 14,999 ج.م!",
                icon: "./icons/icon-192.png"
              });
            }
          } else {
            new Notification("🔥 DealsRadar EG Alert | تخفيض حارق!", {
              body: "تم رصد تخفيض 45% على شاشة سامسونج 55 بوصة بسعر 14,999 ج.م!",
              icon: "./icons/icon-192.png"
            });
          }
        } catch (err) {
          console.warn("Direct Notification trigger error:", err);
        }
      } else if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }

      // 2. Add to internal notification store
      const testDeal = {
        title: "🔥 صفقات رادار مصر: خصم 45% على ماكينة قهوة ديلونجي ديديكا!",
        body: "انخفض السعر الآن إلى 8,999 ج.م بدلاً من 15,400 ج.م على نون مصر.",
        url: "https://www.noon.com/egypt-en/dedica-deluxe-espresso-maker/N21287900A/p/",
        discount_percent: 41.6,
        price: 8999.0,
        store_name: "Noon EG"
      };

      await api.sendTestPush(deviceId, testDeal.title, testDeal.body);
      
      // 3. Reload list
      await loadNotifications();
      setToastMsg("✅ تم إرسال الإشعار التجريبي وإضافته بنجاح!");
      setTimeout(() => setToastMsg(""), 4000);
    } catch (err) {
      console.error("Test notification error:", err);
      setToastMsg("⚠️ تعذر إرسال الإشعار التجريبي.");
      setTimeout(() => setToastMsg(""), 4000);
    } finally {
      setTestSending(false);
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-slideLeft">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Bell className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-100">مركز الإشعارات والتنبيهات</h2>
              <span className="text-[11px] text-slate-400">الصفقات التي تم رصدها وفق شروطك</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Trigger & Action Bar */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-col gap-2">
          
          {/* Send Test Notification Button */}
          <button
            onClick={handleSendTestNotification}
            disabled={testSending}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${testSending ? "animate-spin" : ""}`} />
            <span>{testSending ? "جاري إرسال التنبيه..." : "🚀 تجربة تنبيه فوري (Send Test Alert)"}</span>
          </button>

          {toastMsg && (
            <div className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 p-2 rounded-lg text-center animate-fadeIn">
              {toastMsg}
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400 text-[11px]">
              غير مقروء: <b className="text-amber-400">{unreadCount}</b> / الإجمالي: {notifications.length}
            </span>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>تحديد كمقروء</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح الكل</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {loading ? (
            <div className="text-center py-8 text-slate-500">جاري تحميل التنبيهات...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center mx-auto text-slate-600">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="text-slate-300 font-bold">لا توجد تنبيهات جديدة بعد</div>
              <div className="text-slate-500 text-[11px] max-w-xs mx-auto">
                اضغط على زر <b>تجربة تنبيه فوري</b> أعلاه لاختبار نظام الإشعارات فوراً، أو أنشئ قاعدة تنبيه مخصصة من شريط التنقل!
              </div>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkRead(notif.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                  notif.is_read
                    ? "bg-slate-950/40 border-slate-800/80 opacity-80 hover:opacity-100"
                    : "bg-slate-950/90 border-amber-500/40 shadow-md shadow-amber-500/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 font-extrabold text-[10px]">
                      -{typeof notif.discount_percent === "number" ? notif.discount_percent.toFixed(0) : "40"}% OFF
                    </span>
                    <span className="text-[11px] font-bold text-amber-400">{notif.store_name || "متجر مصري"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">
                      {new Date(notif.created_at || Date.now()).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <button
                      onClick={(e) => handleDeleteNotification(e, notif.id)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                      title="حذف هذا الإشعار"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-slate-100 text-xs mt-1.5 leading-snug">{notif.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{notif.body}</p>

                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-amber-400 font-black font-['Outfit'] text-xs">
                    {(notif.price || 0).toLocaleString()} ج.م
                  </span>
                  <a
                    href={getLiveDealUrl(notif)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold"
                  >
                    <span>فتح الصفقة في {notif.store_name?.replace(" EG", "") || "المتجر"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
