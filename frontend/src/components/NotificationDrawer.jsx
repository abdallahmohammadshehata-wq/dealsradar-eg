import React, { useState, useEffect } from "react";
import { Bell, X, CheckCheck, ExternalLink, Sparkles, ShoppingBag } from "lucide-react";
import { api } from "../api/client";

export function NotificationDrawer({ isOpen, onClose, deviceId, onNotificationCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      if (onNotificationCountChange) onNotificationCountChange(0);
    } catch (e) {}
  };

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {}
  };

  if (!isOpen) return null;

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

        {/* Action Bar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 text-xs">
          <span className="text-slate-400">
            غير مقروء: <b className="text-amber-400">{notifications.filter(n => !n.is_read).length}</b>
          </span>
          {notifications.some(n => !n.is_read) && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>تحديد الكل كمقروء</span>
            </button>
          )}
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
              <div className="text-slate-400 font-bold">لا توجد تنبيهات جديدة بعد</div>
              <div className="text-slate-500 text-[11px] max-w-xs mx-auto">
                عندما يرصد الرادار صفقات تطابق قواعدك المخصصة أو عناصر المفضلة، ستظهر الإشعارات هنا فوراً.
              </div>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkRead(notif.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  notif.is_read
                    ? "bg-slate-950/40 border-slate-800/80 opacity-75"
                    : "bg-slate-950/90 border-amber-500/30 shadow-md shadow-amber-500/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 font-extrabold text-[10px]">
                      -{notif.discount_percent.toFixed(0)}% OFF
                    </span>
                    <span className="text-[11px] font-bold text-amber-400">{notif.store_name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(notif.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <h4 className="font-bold text-slate-100 text-xs mt-1.5 leading-snug">{notif.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{notif.body}</p>

                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-amber-400 font-black font-['Outfit']">
                    {notif.price.toLocaleString()} ج.م
                  </span>
                  <a
                    href={notif.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold"
                  >
                    <span>فتح الصفقة</span>
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
