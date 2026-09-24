import React from "react";
import { Star, BellRing, Trash2, ShoppingBag } from "lucide-react";
import { DealCard } from "./DealCard";

export function WatchlistView({ watchedDeals, onToggleWatch, onOpenHistory }) {
  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Star className="w-5 h-5 fill-amber-400/20 text-amber-400" />
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-100">
              قائمة المراقبة والمفضلة (Watchlist)
            </h2>
            <span className="text-[11px] text-slate-400">
              يتم فحص وتنبيهك بأي انخفاض إضافي في أسعار هذه المنتجات
            </span>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-amber-400 font-bold">
          {watchedDeals.length} عنصر
        </span>
      </div>

      {watchedDeals.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800/80 p-6 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center mx-auto text-slate-600">
            <BellRing className="w-7 h-7 text-slate-600" />
          </div>
          <h3 className="text-slate-200 font-bold text-sm">قائمة المراقبة فارغة حالياً</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            انقر على أيقونة الجرس 🔔 أو اسحب لليمين على أي بطاقة صفقة لتتبعها وتلقي إشعار فوري عند انخفاض سعرها.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {watchedDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              isWatched={true}
              onToggleWatch={onToggleWatch}
              onOpenHistory={onOpenHistory}
            />
          ))}
        </div>
      )}
    </div>
  );
}
