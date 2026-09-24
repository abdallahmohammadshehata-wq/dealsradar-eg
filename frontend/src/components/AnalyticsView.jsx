import React from "react";
import { TrendingDown, Sparkles, Zap, Store, BarChart3, ArrowUpRight, ShieldCheck } from "lucide-react";
import { DealCard } from "./DealCard";

export function AnalyticsView({ stats, onOpenHistory, onToggleWatch }) {
  if (!stats) {
    return (
      <div className="p-8 text-center text-slate-500">
        جاري تحميل بيانات الرادار الإحصائية...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Hero Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>إجمالي الصفقات</span>
            <Store className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-['Outfit']">
            {stats.total_deals?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">محدثة لحظياً</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>متوسط الخصم</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-['Outfit']">
            {stats.average_discount || 0}%
          </div>
          <div className="text-[11px] text-slate-400 font-medium">عبر جميع المتاجر</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>أقل سعر تاريخي</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-['Outfit']">
            {stats.all_time_lows_count || 0}
          </div>
          <div className="text-[11px] text-emerald-400/80 font-medium">صفقة قياسية</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>عروض فلاش</span>
            <Zap className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400 font-['Outfit']">
            {stats.flash_sales_count || 0}
          </div>
          <div className="text-[11px] text-orange-400/80 font-medium">لفترة محدودة</div>
        </div>
      </div>

      {/* Market Breakdown: Store vs Store & Top Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Deals & Avg Discount by Store */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              مقارنة المتاجر (Store Comparison)
            </h3>
            <span className="text-[11px] text-slate-400">حسب متوسط الخصم</span>
          </div>

          <div className="space-y-3">
            {stats.deals_by_store?.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-200">{item.store}</span>
                  <div className="flex gap-2">
                    <span className="text-slate-400">{item.count} صفقة</span>
                    <span className="font-bold text-amber-400 font-['Outfit']">{item.avg_discount}% خصم</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${Math.min(100, item.avg_discount * 1.8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Discounted Categories */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              أعلى الفئات تخفيضاً (Top Categories)
            </h3>
            <span className="text-[11px] text-slate-400">في السوق المصري</span>
          </div>

          <div className="space-y-3">
            {stats.top_categories?.map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-200">{cat.category}</span>
                  <div className="flex gap-2">
                    <span className="text-slate-400">{cat.count} منتج</span>
                    <span className="font-bold text-emerald-400 font-['Outfit']">{cat.avg_discount}%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${Math.min(100, cat.avg_discount * 1.8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Biggest Drops Today Carousel / Grid */}
      {stats.biggest_drops_today?.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <TrendingDown className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-sm text-slate-100">أقوى التخفيضات التي تم رصدها اليوم</h3>
            </div>
            <span className="text-xs text-amber-400 font-bold">خصومات تصل إلى 55%+</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {stats.biggest_drops_today.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onOpenHistory={onOpenHistory}
                onToggleWatch={onToggleWatch}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
