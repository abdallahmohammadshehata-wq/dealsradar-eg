import React, { useState, useEffect } from "react";
import { 
  PlusCircle, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Sparkles, 
  Loader2, 
  Globe, 
  Link, 
  Store, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  Zap,
  Target,
  Layers,
  ArrowRight,
  TrendingDown,
  Check
} from "lucide-react";
import { api } from "../api/client";

export function AddSiteModal({ isOpen, onClose, onStoreCreated }) {
  // Mode: "auto" | "single_product" | "custom_selectors"
  const [activeMode, setActiveMode] = useState("auto");

  // Core Form Fields
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Electronics");

  // Live Auto-Detected Domain & Logo preview
  const [detectedDomain, setDetectedDomain] = useState("");
  const [detectedLogo, setDetectedLogo] = useState("");
  const [detectedPageType, setDetectedPageType] = useState("home"); // "deals" | "product" | "home"

  // Optional Advanced Selectors
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [itemContainer, setItemContainer] = useState(".product-card, .product-item, .item, .card, [data-product]");
  const [titleSelector, setTitleSelector] = useState(".product-title, .title, .product-name, h2, h3, a");
  const [currPriceSelector, setCurrPriceSelector] = useState(".price, .price-now, .special-price, .current-price, .amount");
  const [origPriceSelector, setOrigPriceSelector] = useState(".old-price, .price-was, .regular-price, del, s");

  // Validation & Submission State
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Popular Egyptian Stores Presets
  const quickStores = [
    { name: "كافيلاكس مصر (Cafelax)", url: "https://www.cafelax.com", cat: "Home & Kitchen", icon: "☕" },
    { name: "راية شوب (RayaShop)", url: "https://www.rayashop.com/en/deals", cat: "Electronics", icon: "📱" },
    { name: "تريد لاين (Tradeline EG)", url: "https://tradeline.net/offers", cat: "Electronics", icon: "🍎" },
    { name: "دريم 2000 (Dream2000)", url: "https://dream2000.com/offers", cat: "Electronics", icon: "⚡" },
    { name: "2B مصر (2B Egypt)", url: "https://2b.com.eg", cat: "Electronics", icon: "💻" },
    { name: "بي تك (B.TECH)", url: "https://btech.com/en/deals", cat: "Electronics", icon: "📺" },
    { name: "كارفور مصر (Carrefour EG)", url: "https://www.carrefouregypt.com/mafegy/ar/c/deals", cat: "Supermarket", icon: "🛒" },
    { name: "سبينيس مصر (Spinneys EG)", url: "https://spinneys-egypt.com/deals", cat: "Supermarket", icon: "🥦" },
    { name: "زارا مصر (Zara EG)", url: "https://www.zara.com/eg/en/sale", cat: "Fashion", icon: "👗" }
  ];

  // Dynamic URL Inspection & Auto-naming on user typing
  useEffect(() => {
    if (!url.trim()) {
      setDetectedDomain("");
      setDetectedLogo("");
      setDetectedPageType("home");
      return;
    }

    let clean = url.trim();
    if (!clean.startsWith("http")) clean = "https://" + clean;

    try {
      const parsed = new URL(clean);
      const host = parsed.hostname.replace(/^www\./, "");
      setDetectedDomain(host);
      setDetectedLogo(`https://www.google.com/s2/favicons?domain=${host}&sz=128`);

      // Detect page type
      const path = parsed.pathname.toLowerCase();
      if (path.includes("deal") || path.includes("offer") || path.includes("sale") || path.includes("discount") || path.includes("clearance") || path.includes("collection")) {
        setDetectedPageType("deals");
      } else if (path.includes("product") || path.includes("item") || path.includes("/dp/") || path.includes("/p/") || path.includes("-p-") || path.includes(".html")) {
        setDetectedPageType("product");
      } else {
        setDetectedPageType("home");
      }

      // Auto-set Name if empty
      if (!name.trim()) {
        const brand = host.split(".")[0];
        const formatted = brand.charAt(0).toUpperCase() + brand.slice(1);
        setName(formatted);
      }
    } catch (e) {
      // Invalid URL syntax while typing
    }
  }, [url]);

  if (!isOpen) return null;

  const handleSelectPreset = (store) => {
    setName(store.name);
    setUrl(store.url);
    setCategory(store.cat);
    setValidationResult(null);
    setErrorMsg("");
  };

  const handleAppendPath = (subpath) => {
    if (!url.trim()) return;
    let clean = url.trim().replace(/\/+$/, "");
    if (!clean.startsWith("http")) clean = "https://" + clean;
    try {
      const parsed = new URL(clean);
      setUrl(`${parsed.origin}${subpath}`);
      setValidationResult(null);
    } catch (e) {}
  };

  const handleDryRunTest = async () => {
    if (!url.trim()) {
      setErrorMsg("يرجى إدخال رابط الموقع أو صفحة العروض أولاً.");
      return;
    }

    setIsValidating(true);
    setErrorMsg("");
    setValidationResult(null);

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;

    try {
      const res = await api.validateStore(cleanUrl, {
        listing_url: cleanUrl,
        item_container_selector: itemContainer,
        title_selector: titleSelector,
        current_price_selector: currPriceSelector,
        original_price_selector: origPriceSelector,
        category: category
      });
      setValidationResult(res);
    } catch (err) {
      setErrorMsg("تعذر التحقق من الرابط. تأكد من اتصال الإنترنت وصحة العنوان.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    let cleanUrl = url.trim();

    if (!cleanName || !cleanUrl) {
      setErrorMsg("يرجى إدخال اسم المتجر ورابط الموقع.");
      return;
    }

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const created = await api.registerStore({
        name: cleanName,
        url: cleanUrl,
        base_url: cleanUrl,
        category: category,
        custom_config: {
          listing_url: cleanUrl,
          item_container_selector: itemContainer,
          title_selector: titleSelector,
          current_price_selector: currPriceSelector,
          original_price_selector: origPriceSelector,
          category: category
        }
      });
      setIsSubmitting(false);
      if (onStoreCreated) onStoreCreated(created);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.message || "فشل تسجيل المتجر. قد يكون مضافاً مسبقاً.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <PlusCircle className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-100">إضافة موقع أو متجر جديد</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-extrabold">
                  Universal Radar
                </span>
              </div>
              <span className="text-[11px] text-slate-400">التقاط الصفقات وتتبع انخفاض الأسعار تلقائياً عبر أي متجر</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Mode Switcher Tabs */}
        <div className="flex items-center gap-1 px-5 sm:px-6 pt-3 pb-1 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveMode("auto")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeMode === "auto"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ مسح متجر ذكي (Auto Radar)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("single_product")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeMode === "single_product"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>🎯 تتبع صفقة محددة (Product Link)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("custom_selectors")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeMode === "custom_selectors"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>🛠️ محددات مخصصة للمطورين</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Quick 1-Tap Egyptian Presets */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px]">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                متاجر مصرية جاهزة (إضافة فورية بنقرة واحدة):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickStores.map((st) => (
                <button
                  key={st.name}
                  type="button"
                  onClick={() => handleSelectPreset(st)}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/80 font-medium text-[11px] transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>{st.icon}</span>
                  <span>{st.name}</span>
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 rounded-xl flex items-center gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Website / Deals URL with Live Domain Detection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-bold flex items-center gap-1.5">
                <Link className="w-4 h-4 text-amber-400" />
                <span>
                  {activeMode === "single_product" 
                    ? "رابط المنتج المراد تتبعه (Direct Product Link):" 
                    : "رابط الموقع أو صفحة العروض (Website / Deals URL):"}
                </span>
              </label>

              {detectedPageType === "deals" && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  🛒 قسم عروض مكتشف
                </span>
              )}
              {detectedPageType === "product" && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                  🎯 رابط منتج مباشر
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={
                    activeMode === "single_product"
                      ? "https://www.amazon.eg/dp/... أو https://tradeline.net/product/..."
                      : "https://www.rayashop.com أو https://tradeline.net/offers"
                  }
                  className="w-full pl-3 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-xs sm:text-sm font-mono"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={handleDryRunTest}
                disabled={isValidating || !url.trim()}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-300 font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 shrink-0 text-xs transition-all shadow-sm active:scale-95"
                title="فحص واختبار الرابط عبر محرك الرادار"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الفحص...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>فحص الرابط</span>
                  </>
                )}
              </button>
            </div>

            {/* Smart Deals Path Chips Suggestions */}
            {detectedDomain && detectedPageType === "home" && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                <span className="text-slate-400">اقتراح أقسام العروض:</span>
                {["/deals", "/offers", "/sale", "/collections/all", "/hot-deals"].map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => handleAppendPath(sub)}
                    className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-amber-300 border border-slate-800 font-mono text-[10px] transition-all"
                  >
                    + {sub}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Store Name & Brand Logo Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-slate-200 font-bold flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-400" />
                <span>اسم المتجر / العلامة التجارية (Store Name):</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: راية شوب، تريد لاين، كافيلاكس، كارفور..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>شعار المتجر:</span>
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl h-[42px]">
                {detectedLogo ? (
                  <img src={detectedLogo} alt="" className="w-6 h-6 object-contain rounded" />
                ) : (
                  <Globe className="w-5 h-5 text-slate-600" />
                )}
                <span className="text-slate-400 text-[11px] truncate font-mono">
                  {detectedDomain || "domain.com"}
                </span>
              </div>
            </div>
          </div>

          {/* Category selection */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">الفئة الرئيسية للمتجر / المنتجات:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500/50 text-xs"
            >
              <option value="Electronics">إلكترونيات وموبايلات (Electronics)</option>
              <option value="Home & Kitchen">المنزل والمطبخ وأجهزة القهوة (Home & Kitchen)</option>
              <option value="Fashion">أزياء وملابس وأحذية (Fashion)</option>
              <option value="Beauty & Personal Care">عطور وعناية شخصية (Beauty)</option>
              <option value="Supermarket">سوبرماركت وأغذية (Supermarket)</option>
              <option value="General">عام / متنوع (General Store)</option>
            </select>
          </div>

          {/* Live Validation Result & Sample Deals Preview */}
          {validationResult && (
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{validationResult.message}</span>
                </div>
                {validationResult.platform && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    {validationResult.platform}
                  </span>
                )}
              </div>

              {validationResult.sample_items && validationResult.sample_items.length > 0 && (
                <div className="pt-2 border-t border-emerald-900/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-emerald-300 font-bold">
                    <span>عينات المنتجات والأسعار التي تم التقاطها:</span>
                    <span className="text-slate-400 text-[10px]">
                      {validationResult.items_extracted_count} صفقة نشطة
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {validationResult.sample_items.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-emerald-900/40">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-10 h-10 object-contain rounded-lg bg-slate-900 p-0.5 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 text-slate-500 text-xs">🛍️</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-200 text-[11px] font-bold truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-amber-400 font-extrabold text-xs font-['Outfit']">
                              {item.current_price?.toLocaleString()} ج.م
                            </span>
                            {item.original_price > item.current_price && (
                              <span className="text-slate-500 line-through text-[10px]">
                                {item.original_price?.toLocaleString()}
                              </span>
                            )}
                            {item.discount_percent > 0 && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">
                                -{item.discount_percent}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Advanced Developer Selectors (Collapsible) */}
          {(activeMode === "custom_selectors" || showAdvanced) && (
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/90 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-slate-300 font-semibold text-xs">
                <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  محددات CSS الدقيقة (CSS Selectors Control):
                </span>
                <span className="text-[10px] text-slate-500 font-normal">اختياري - يكتشفها الرادار تلقائياً</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-medium">محدد بطاقة المنتج (Card Container):</label>
                  <input
                    type="text"
                    value={itemContainer}
                    onChange={(e) => setItemContainer(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-medium">محدد اسم المنتج (Title Selector):</label>
                  <input
                    type="text"
                    value={titleSelector}
                    onChange={(e) => setTitleSelector(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-medium">محدد السعر الحالي (Current Price):</label>
                  <input
                    type="text"
                    value={currPriceSelector}
                    onChange={(e) => setCurrPriceSelector(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] font-medium">محدد السعر الأصلي (Original Price):</label>
                  <input
                    type="text"
                    value={origPriceSelector}
                    onChange={(e) => setOrigPriceSelector(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !url.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 disabled:opacity-50 text-slate-950 font-black shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95 text-xs sm:text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل وفحص المتجر...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>تأكيد وإضافة المتجر للرادار</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
