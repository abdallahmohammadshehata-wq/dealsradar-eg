import React, { useState } from "react";
import { Search, SlidersHorizontal, Sparkles, Zap, TrendingDown, Store, X, ArrowDownUp } from "lucide-react";

export function DualFilterBar({
  filters,
  onChange,
  onReset,
  availableStores = ["Amazon EG", "Noon EG", "Jumia EG", "B.TECH Egypt", "2B Egypt"],
  availableCategories = ["All", "Electronics", "Home & Kitchen", "Fashion", "Beauty & Personal Care", "Supermarket"]
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStoreToggle = (storeName) => {
    let current = filters.stores || [];
    if (typeof current === "string") current = current.split(",").map(s => s.trim());
    
    let next;
    if (current.includes(storeName)) {
      next = current.filter(s => s !== storeName);
    } else {
      next = [...current, storeName];
    }
    onChange({ ...filters, stores: next, page: 1 });
  };

  const selectedStores = Array.isArray(filters.stores) 
    ? filters.stores 
    : (filters.stores ? filters.stores.split(",") : []);

  const hasActiveFilters = 
    (filters.min_discount && filters.min_discount > 0) ||
    filters.min_price ||
    filters.max_price ||
    (selectedStores.length > 0 && selectedStores.length < availableStores.length) ||
    (filters.category && filters.category !== "All") ||
    filters.is_all_time_low ||
    filters.is_flash_sale ||
    filters.search;

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-[61px] z-30 transition-all shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        
        {/* Top Quick Bar: Search Input, Quick Category Pills & Expand Button */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          
          {/* Bilingual Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={filters.search || ""}
              onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
              placeholder="ابحث عن منتج، ماركة، أو فئة (مثال: سامسونج، قلاية هوائية، ايفون)..."
              className="w-full pl-9 pr-9 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
            />
            {filters.search && (
              <button
                onClick={() => onChange({ ...filters, search: "", page: 1 })}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Action Pills: Sort Dropdown & Toggle Filters drawer */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
              <ArrowDownUp className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={filters.sort_by || "discount_desc"}
                onChange={(e) => onChange({ ...filters, sort_by: e.target.value, page: 1 })}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
              >
                <option value="discount_desc" className="bg-slate-900">أعلى نسبة خصم (Biggest Drop)</option>
                <option value="price_asc" className="bg-slate-900">السعر: من الأقل للأعلى</option>
                <option value="price_desc" className="bg-slate-900">السعر: من الأعلى للأقل</option>
                <option value="all_time_low" className="bg-slate-900">أقل سعر تاريخي (Historical Low)</option>
                <option value="newest" className="bg-slate-900">الأحدث إضافة</option>
              </select>
            </div>

            {/* Expand / Filter Controls Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                isExpanded || hasActiveFilters
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                  : "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>الفلاتر المتقدمة</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Category Facet Horizontal Scrollable Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 mt-1">
          {["All", ...availableCategories.filter(c => c !== "All")].map((cat) => {
            const isSelected = (filters.category || "All") === cat;
            return (
              <button
                key={cat}
                onClick={() => onChange({ ...filters, category: cat, page: 1 })}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20"
                    : "bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800/80"
                }`}
              >
                {cat === "All" ? "🔥 الكل (All)" : cat}
              </button>
            );
          })}

          {/* All Time Low Pill */}
          <button
            onClick={() => onChange({ ...filters, is_all_time_low: !filters.is_all_time_low, page: 1 })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
              filters.is_all_time_low
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10"
                : "bg-slate-950/60 text-slate-400 border-slate-800 hover:border-emerald-500/30"
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>أقل سعر تاريخي</span>
          </button>

          {/* Flash Sale Pill */}
          <button
            onClick={() => onChange({ ...filters, is_flash_sale: !filters.is_flash_sale, page: 1 })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
              filters.is_flash_sale
                ? "bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-sm shadow-orange-500/10"
                : "bg-slate-950/60 text-slate-400 border-slate-800 hover:border-orange-500/30"
            }`}
          >
            <Zap className="w-3 h-3 text-orange-400" />
            <span>عروض فلاش</span>
          </button>
        </div>

        {/* Expanded Controls: Discount Slider, Price Range, Store Checkboxes */}
        {isExpanded && (
          <div className="mt-2.5 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-fadeIn">
            
            {/* 1. Minimum Discount Slider */}
            <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between font-medium text-slate-300">
                <span className="flex items-center gap-1 text-amber-400">
                  <TrendingDown className="w-3.5 h-3.5" />
                  أدنى نسبة خصم:
                </span>
                <span className="text-sm font-extrabold text-amber-400">
                  {filters.min_discount || 0}% فأكثر
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={filters.min_discount || 0}
                onChange={(e) => onChange({ ...filters, min_discount: parseFloat(e.target.value), page: 1 })}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0%</span>
                <span>20%</span>
                <span>40%</span>
                <span>60%</span>
                <span>80%+</span>
              </div>
            </div>

            {/* 2. Price Range (EGP Bounds) */}
            <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="font-medium text-slate-300 block">نطاق السعر (جنيه مصري / EGP):</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="من (Min)"
                  value={filters.min_price || ""}
                  onChange={(e) => onChange({ ...filters, min_price: e.target.value ? parseFloat(e.target.value) : null, page: 1 })}
                  className="w-1/2 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  placeholder="إلى (Max)"
                  value={filters.max_price || ""}
                  onChange={(e) => onChange({ ...filters, max_price: e.target.value ? parseFloat(e.target.value) : null, page: 1 })}
                  className="w-1/2 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* 3. Platform Stores Checkboxes */}
            <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-300 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-orange-400" />
                  المتاجر المستهدفة:
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={onReset}
                    className="text-[11px] text-rose-400 hover:text-rose-300 underline"
                  >
                    إعادة ضبط
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {availableStores.map((store) => {
                  const isChecked = selectedStores.length === 0 || selectedStores.includes(store);
                  return (
                    <button
                      key={store}
                      onClick={() => handleStoreToggle(store)}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                        isChecked
                          ? "bg-slate-800 border-amber-500/40 text-amber-300"
                          : "bg-slate-950 border-slate-800 text-slate-500 opacity-60"
                      }`}
                    >
                      {store}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
