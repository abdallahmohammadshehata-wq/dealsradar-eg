import React, { useState, useEffect } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  Zap, 
  TrendingDown, 
  Store, 
  X, 
  ArrowDownUp, 
  Plus, 
  Tag, 
  Check,
  FolderPlus
} from "lucide-react";

export function DualFilterBar({
  filters,
  onChange,
  onReset,
  onOpenAddSite,
  availableStores = ["Amazon EG", "Noon EG", "Jumia EG", "B.TECH Egypt", "2B Egypt"],
  availableCategories = ["All", "Electronics", "Home & Kitchen", "Fashion", "Beauty & Personal Care", "Supermarket"]
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingSpecial, setIsAddingSpecial] = useState(false);
  const [newSpecialCategory, setNewSpecialCategory] = useState("");

  // Custom / Special categories stored in localStorage
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem("dealsradar_custom_categories");
      return saved ? JSON.parse(saved) : ["Gaming & Laptops", "Smartphones / موبايلات", "Air Fryers / قلايات"];
    } catch (e) {
      return ["Gaming & Laptops", "Smartphones / موبايلات", "Air Fryers / قلايات"];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("dealsradar_custom_categories", JSON.stringify(customCategories));
    } catch (e) {}
  }, [customCategories]);

  // Normalize selected categories into an array
  const getSelectedCategories = () => {
    if (Array.isArray(filters.categories)) return filters.categories;
    if (filters.category && filters.category !== "All") return [filters.category];
    return [];
  };

  const selectedCategories = getSelectedCategories();

  // Toggle Category selection (Multi-Select)
  const handleCategoryToggle = (cat) => {
    if (cat === "All") {
      onChange({ ...filters, categories: [], category: "All", page: 1 });
      return;
    }

    let next;
    if (selectedCategories.includes(cat)) {
      next = selectedCategories.filter(c => c !== cat);
    } else {
      next = [...selectedCategories, cat];
    }

    onChange({ 
      ...filters, 
      categories: next, 
      category: next.length === 1 ? next[0] : (next.length === 0 ? "All" : next.join(",")),
      page: 1 
    });
  };

  // Add a new special / custom category
  const handleAddSpecialCategory = (e) => {
    e?.preventDefault();
    const trimmed = newSpecialCategory.trim();
    if (!trimmed) return;

    if (!customCategories.includes(trimmed)) {
      setCustomCategories([trimmed, ...customCategories]);
    }

    // Auto select this newly created category
    const next = [...selectedCategories.filter(c => c !== trimmed), trimmed];
    onChange({
      ...filters,
      categories: next,
      category: next.length === 1 ? next[0] : next.join(","),
      page: 1
    });

    setNewSpecialCategory("");
    setIsAddingSpecial(false);
  };

  // Remove a custom category
  const handleRemoveCustomCategory = (e, cat) => {
    e.stopPropagation();
    const updated = customCategories.filter(c => c !== cat);
    setCustomCategories(updated);
    
    if (selectedCategories.includes(cat)) {
      const next = selectedCategories.filter(c => c !== cat);
      onChange({
        ...filters,
        categories: next,
        category: next.length === 1 ? next[0] : (next.length === 0 ? "All" : next.join(",")),
        page: 1
      });
    }
  };

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
    selectedCategories.length > 0 ||
    filters.is_all_time_low ||
    filters.is_flash_sale ||
    filters.search;

  const standardCategories = ["All", ...availableCategories.filter(c => c !== "All")];

  return (
    <div className="w-full max-w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-[53px] sm:top-[61px] z-30 transition-all shadow-md overflow-hidden">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 min-w-0">
        
        {/* Top Quick Bar: Search Input, Quick Category Pills & Expand Button */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 min-w-0">
          
          {/* Bilingual Search Box */}
          <div className="relative flex-1 w-full min-w-0">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={filters.search || ""}
              onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
              placeholder="ابحث عن منتج، ماركة، أو فئة (مثال: سامسونج، قلاية هوائية، ايفون)..."
              className="w-full pl-9 pr-9 py-1.5 sm:py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
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
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start min-w-0">
            
            {/* Sort Selector */}
            <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-300 min-w-0 flex-1 sm:flex-none">
              <ArrowDownUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={filters.sort_by || "discount_desc"}
                onChange={(e) => onChange({ ...filters, sort_by: e.target.value, page: 1 })}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer pr-1 w-full truncate"
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
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 shrink-0 ${
                isExpanded || hasActiveFilters
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                  : "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden min-[350px]:inline">فلاتر</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Multi-Category Selection Bar & Special Category Adder */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 mt-1 w-full max-w-full">
          
          {/* "All" Category Pill */}
          <button
            onClick={() => handleCategoryToggle("All")}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              selectedCategories.length === 0
                ? "bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20"
                : "bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800/80"
            }`}
          >
            <span>🔥 الكل (All)</span>
          </button>

          {/* Standard Categories (Multi-selectable) */}
          {standardCategories.filter(c => c !== "All").map((cat) => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => handleCategoryToggle(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20 ring-1 ring-amber-400"
                    : "bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800/80"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                <span>{cat}</span>
              </button>
            );
          })}

          {/* User Custom / Special Categories */}
          {customCategories.map((cat) => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <div
                key={cat}
                onClick={() => handleCategoryToggle(cat)}
                className={`group flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold border-purple-400/60 shadow-sm shadow-purple-500/20"
                    : "bg-purple-950/30 text-purple-300 border-purple-800/50 hover:bg-purple-900/40"
                }`}
              >
                <Tag className="w-3 h-3 text-purple-300" />
                <span>{cat}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveCustomCategory(e, cat)}
                  title="حذف هذه الفئة المخصصة"
                  className="mr-0.5 p-0.5 rounded-full hover:bg-purple-900/80 text-purple-200 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* Add Special Category Button */}
          <button
            onClick={() => setIsAddingSpecial(!isAddingSpecial)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${
              isAddingSpecial
                ? "bg-purple-600 text-white border-purple-400"
                : "bg-purple-950/40 text-purple-300 border-purple-700/60 hover:bg-purple-900/40 hover:text-purple-200"
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ فئة خاصة (Special)</span>
          </button>

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

        {/* Special Category Input Expandable Drawer */}
        {isAddingSpecial && (
          <div className="mt-2 p-3 bg-purple-950/50 border border-purple-600/40 rounded-2xl animate-fadeIn space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-200 font-bold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                إضافة فئة خاصة أو مخصصة (Custom Category Filter):
              </span>
              <button
                onClick={() => setIsAddingSpecial(false)}
                className="text-purple-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSpecialCategory} className="flex gap-2">
              <input
                type="text"
                value={newSpecialCategory}
                onChange={(e) => setNewSpecialCategory(e.target.value)}
                placeholder="أدخل اسم الفئة الخاصة (مثال: ألعاب فيديو، لابتوبات، عطور، ساعات ذكية)..."
                className="flex-1 px-3 py-1.5 bg-slate-950/90 border border-purple-700/60 rounded-xl text-xs text-purple-100 placeholder-purple-400/60 focus:outline-none focus:border-purple-400"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newSpecialCategory.trim()}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all shrink-0"
              >
                إضافة وتطبيق
              </button>
            </form>

            {/* Quick suggested special categories */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-purple-300/80">اقتراحات سريعة:</span>
              {[
                "Gaming / جيمنج", 
                "Smartphones / هواتف", 
                "Smart Watches / ساعات", 
                "Espresso / قهوة", 
                "Shoes / أحذية رياضية", 
                "Air Fryers / قلايات"
              ].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => {
                    setNewSpecialCategory(sug);
                  }}
                  className="px-2 py-0.5 rounded-md bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/40"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

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

                {onOpenAddSite && (
                  <button
                    onClick={onOpenAddSite}
                    className="px-2.5 py-1 rounded-md text-[11px] font-bold border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-1 active:scale-95"
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    <span>+ متجر جديد</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
