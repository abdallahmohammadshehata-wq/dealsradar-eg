import React, { useState } from "react";
import { ExternalLink, LineChart, Bell, BellRing, Share2, Star, Sparkles, Zap, EyeOff } from "lucide-react";
import { getLiveDealUrl } from "../api/client";

export function DealCard({
  deal,
  isWatched = false,
  onToggleWatch,
  onOpenHistory,
  onDismiss
}) {
  const [touchStartX, setTouchStartX] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Store Brand color helpers
  const getStoreBadgeColor = (storeName) => {
    switch (storeName) {
      case "Amazon EG":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "Noon EG":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "Jumia EG":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "B.TECH Egypt":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: deal.title,
          text: `🔥 خصم ${deal.discount_percent}% على ${deal.title} بسعر ${deal.current_price.toLocaleString()} ج.م على ${deal.store_name}!`,
          url: deal.url
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(`${deal.title} - ${deal.url}`);
      alert("تم نسخ رابط العرض إلى الحافظة!");
    }
  };

  // Touch Swipe Handlers (Swipe Right = Watch, Swipe Left = Dismiss)
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;
    if (Math.abs(diff) < 80) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 60) {
      // Swiped right -> Watch
      onToggleWatch(deal);
    } else if (swipeOffset < -60 && onDismiss) {
      // Swiped left -> Dismiss
      onDismiss(deal.id);
    }
    setSwipeOffset(0);
    setTouchStartX(null);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateX(${swipeOffset}px)` }}
      className="group relative flex flex-col bg-slate-900/90 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-amber-500/5 select-none"
    >
      {/* Top Image & High-Contrast Badges */}
      <div className="relative w-full aspect-[4/3] bg-slate-950/80 overflow-hidden flex items-center justify-center p-3">
        {deal.image_url ? (
          <img
            src={deal.image_url}
            alt={deal.title}
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-slate-600 text-xs">لا تتوفر صورة</div>
        )}

        {/* Discount Percentage Badge */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
          <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-xs sm:text-sm tracking-tight shadow-md shadow-rose-900/30">
            -{deal.discount_percent.toFixed(0)}% OFF
          </span>
          {deal.is_all_time_low && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/90 text-slate-950 font-extrabold text-[10px] shadow-sm">
              <Sparkles className="w-2.5 h-2.5" />
              أقل سعر تاريخي
            </span>
          )}
          {deal.is_flash_sale && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-500/90 text-slate-950 font-extrabold text-[10px] shadow-sm">
              <Zap className="w-2.5 h-2.5" />
              فلاش ديل
            </span>
          )}
        </div>

        {/* Store Name Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`px-2 py-0.5 rounded-lg font-bold text-[11px] border backdrop-blur-md ${getStoreBadgeColor(deal.store_name)}`}>
            {deal.store_name}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4 gap-2.5">
        
        {/* Category & Rating */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-medium">
            {deal.category}
          </span>
          {deal.rating && (
            <div className="flex items-center gap-1 text-amber-400 font-semibold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{deal.rating}</span>
              <span className="text-slate-500 font-normal">({deal.reviews_count || 0})</span>
            </div>
          )}
        </div>

        {/* Title (Bilingual Arabic/English) */}
        <h3 className="font-bold text-xs sm:text-sm text-slate-100 line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
          {deal.title_ar || deal.title}
        </h3>

        {/* Price Section */}
        <div className="mt-auto pt-2 flex items-baseline justify-between border-t border-slate-800/60">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-xl font-black text-amber-400 font-['Outfit']">
                {deal.current_price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-amber-500">ج.م (EGP)</span>
            </div>
            {deal.original_price > deal.current_price && (
              <div className="flex items-center gap-1 text-xs text-slate-500 line-through -mt-1">
                <span>{deal.original_price.toLocaleString("en-US")} ج.م</span>
              </div>
            )}
          </div>

          {/* Price History Action */}
          <button
            onClick={() => onOpenHistory(deal)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-all"
            title="عرض سجل ومخطط تقلبات السعر"
          >
            <LineChart className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">السجل</span>
          </button>
        </div>

        {/* Bottom CTA Row: Watchlist, Share, Deep-Link */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          
          {/* Watch / Alert Toggle */}
          <button
            onClick={() => onToggleWatch(deal)}
            className={`col-span-1 flex items-center justify-center p-2 rounded-xl border transition-all ${
              isWatched
                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
            }`}
            title={isWatched ? "إلغاء المتابعة" : "تتبع هذا المنتج وإرسال تنبيه بالهبوط"}
          >
            {isWatched ? <BellRing className="w-4 h-4 text-amber-400 fill-amber-400/30" /> : <Bell className="w-4 h-4" />}
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="col-span-1 flex items-center justify-center p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white transition-all"
            title="مشاركة الصفقة"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Deep Link to Retailer */}
          <a
            href={getLiveDealUrl(deal)}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/10 active:scale-95"
          >
            <span>شراء من {deal.store_name.replace(" EG", "")}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
}
