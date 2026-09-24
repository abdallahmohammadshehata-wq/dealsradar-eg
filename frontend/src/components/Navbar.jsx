import React from "react";
import { Radar, Bell, Mic, Camera, Moon, Sun, PlusCircle, Sparkles } from "lucide-react";

export function Navbar({
  unreadCount = 0,
  onOpenNotifications,
  onOpenVoice,
  onOpenImage,
  onOpenAddSite,
  onRadarSweep,
  isSweeping = false,
  theme,
  onToggleTheme,
  stats
}) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-4 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Brand & Animated Radar Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer select-none">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
            <Radar className="w-5 h-5 text-slate-950 animate-spin" style={{ animationDuration: "8s" }} />
            <span className="absolute w-2 h-2 rounded-full bg-emerald-400 top-1 right-1 animate-ping" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent font-['Outfit']">
                DealsRadar
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                EG مصر
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium -mt-0.5">
              صائد الصفقات وتخفيضات الأسعار
            </span>
          </div>
        </div>

        {/* Quick Market Live Stats Pill (Desktop/Tablet) */}
        {stats && (
          <div className="hidden md:flex items-center gap-4 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{stats.total_deals || 0} صفقة نشطة</span>
            </div>
            <span className="text-slate-700">|</span>
            <div>
              متوسط الخصم: <span className="text-amber-400 font-bold">{stats.average_discount || 0}%</span>
            </div>
            <span className="text-slate-700">|</span>
            <div>
              أقل سعر تاريخي: <span className="text-emerald-400 font-bold">{stats.all_time_lows_count || 0}</span>
            </div>
          </div>
        )}

        {/* Action Buttons: Voice, Image, Add Site, Notifications, Theme */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Voice Search Button */}
          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95"
            title="بحث صوتي بالعامية أو الإنجليزية"
          >
            <Mic className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">صوتي</span>
          </button>

          {/* Visual Image Search Button */}
          <button
            onClick={onOpenImage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-orange-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95"
            title="بحث بالصورة أو الكاميرا"
          >
            <Camera className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline">بالصورة</span>
          </button>

          {/* Dynamic Radar Sweep Button */}
          <button
            onClick={onRadarSweep}
            disabled={isSweeping}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="تشغيل الرادار للبحث الدوري عن أحدث الصفقات والأسعار"
          >
            <Radar className={`w-4 h-4 text-amber-400 ${isSweeping ? "animate-spin text-amber-300" : ""}`} />
            <span className="hidden sm:inline">{isSweeping ? "جاري المسح..." : "مسح الرادار"}</span>
          </button>

          {/* Add Custom Website Store */}
          <button
            onClick={onOpenAddSite}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-amber-500/30 text-xs font-semibold transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>إضافة متجر</span>
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all active:scale-95"
            aria-label="الإشعارات"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black rounded-full bg-rose-500 text-white animate-bounce shadow-md">
                {unreadCount > 99 ? "+99" : unreadCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition-all"
            aria-label="تبديل المظهر"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </header>
  );
}
