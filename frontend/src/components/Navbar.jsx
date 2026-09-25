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
    <header className="sticky top-0 z-40 w-full max-w-full backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80 px-2.5 sm:px-4 py-2 sm:py-3 transition-colors overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3 min-w-0">
        
        {/* Brand & Animated Radar Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer select-none min-w-0 shrink">
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 shadow-md shadow-amber-500/20 shrink-0">
            <Radar className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 animate-spin" style={{ animationDuration: "8s" }} />
            <span className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 top-0.5 right-0.5 animate-ping" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent font-['Outfit'] truncate">
                DealsRadar
              </span>
              <span className="text-[9px] sm:text-xs px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold shrink-0">
                EG
              </span>
            </div>
            <span className="text-[9px] sm:text-[11px] text-slate-400 font-medium -mt-0.5 truncate hidden min-[370px]:block">
              صائد الصفقات وتخفيضات الأسعار
            </span>
          </div>
        </div>

        {/* Quick Market Live Stats Pill (Desktop/Tablet) */}
        {stats && (
          <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{stats.total_deals || 0} صفقة نشطة</span>
            </div>
            <span className="text-slate-700">|</span>
            <div>
              متوسط الخصم: <span className="text-amber-400 font-bold">{stats.average_discount || 0}%</span>
            </div>
          </div>
        )}

        {/* Action Buttons: Voice, Image, Add Site, Notifications, Theme */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Voice Search Button */}
          <button
            onClick={onOpenVoice}
            className="flex items-center justify-center p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95 shrink-0"
            title="بحث صوتي بالعامية أو الإنجليزية"
            aria-label="بحث صوتي"
          >
            <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="hidden md:inline mr-1">صوتي</span>
          </button>

          {/* Visual Image Search Button */}
          <button
            onClick={onOpenImage}
            className="flex items-center justify-center p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-orange-500/40 text-xs font-semibold transition-all shadow-sm active:scale-95 shrink-0"
            title="بحث بالصورة أو الكاميرا"
            aria-label="بحث بالصورة"
          >
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
            <span className="hidden md:inline mr-1">بالصورة</span>
          </button>

          {/* Dynamic Radar Sweep Button */}
          <button
            onClick={onRadarSweep}
            disabled={isSweeping}
            className="flex items-center justify-center p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
            title="تشغيل الرادار للبحث الدوري عن أحدث الصفقات والأسعار"
            aria-label="مسح الرادار"
          >
            <Radar className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 ${isSweeping ? "animate-spin text-amber-300" : ""}`} />
            <span className="hidden md:inline mr-1">{isSweeping ? "جاري..." : "مسح"}</span>
          </button>

          {/* Add Custom Website Store */}
          <button
            onClick={onOpenAddSite}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-amber-500/30 text-xs font-semibold transition-all active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>إضافة متجر</span>
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all active:scale-95 shrink-0"
            aria-label="الإشعارات"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 text-[9px] font-black rounded-full bg-rose-500 text-white animate-bounce shadow-md">
                {unreadCount > 99 ? "+99" : unreadCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition-all shrink-0"
            aria-label="تبديل المظهر"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        </div>

      </div>
    </header>
  );
}
