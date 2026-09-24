import React from "react";
import { Flame, Star, BellRing, Globe, BarChart3, Mic } from "lucide-react";

export function BottomNav({ activeTab, onTabChange, watchedCount = 0 }) {
  const tabs = [
    { id: "feed", label: "الصفقات", icon: Flame },
    { id: "watchlist", label: "المفضلة", icon: Star, badge: watchedCount },
    { id: "alerts", label: "التنبيهات", icon: BellRing },
    { id: "stores", label: "المتاجر", icon: Globe },
    { id: "analytics", label: "الرادار", icon: BarChart3 },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 pb-[env(safe-area-inset-bottom,12px)] pt-1.5 px-2 shadow-2xl transition-all">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? "text-amber-400 font-extrabold scale-105"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "fill-amber-400/20" : ""}`} />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
