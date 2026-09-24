import React, { useState } from "react";
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
  Zap
} from "lucide-react";
import { api } from "../api/client";

export function AddSiteModal({ isOpen, onClose, onStoreCreated }) {
  // Simple end-user fields: only Name and Link
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Electronics");

  // Optional Advanced section
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [itemContainer, setItemContainer] = useState(".product-card, .product-item, .item, .card, [data-product]");
  const [titleSelector, setTitleSelector] = useState(".product-title, .title, .product-name, h2, h3, a");
  const [currPriceSelector, setCurrPriceSelector] = useState(".price, .price-now, .special-price, .current-price, .amount");
  const [origPriceSelector, setOrigPriceSelector] = useState(".old-price, .price-was, .regular-price, del, s");

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const quickStores = [
    { name: "راية شوب (RayaShop)", url: "https://www.rayashop.com/en/deals", cat: "Electronics" },
    { name: "تريد لاين (Tradeline EG)", url: "https://tradeline.net/offers", cat: "Electronics" },
    { name: "دريم 2000 (Dream2000)", url: "https://dream2000.com/offers", cat: "Electronics" },
    { name: "كارفور مصر (Carrefour EG)", url: "https://www.carrefouregypt.com/mafegy/ar/c/deals", cat: "Supermarket" },
    { name: "سبينيس مصر (Spinneys EG)", url: "https://spinneys-egypt.com/deals", cat: "Supermarket" },
    { name: "دبي فاشون / زارا (Zara EG)", url: "https://www.zara.com/eg/en/sale", cat: "Fashion" }
  ];

  const handleSelectPreset = (store) => {
    setName(store.name);
    setUrl(store.url);
    setCategory(store.cat);
    setValidationResult(null);
    setErrorMsg("");
  };

  const handleDryRunTest = async () => {
    if (!url.trim()) {
      setErrorMsg("يرجى إدخال رابط الموقع أو صفحة العروض أولاً.");
      return;
    }

    setIsValidating(true);
    setErrorMsg("");
    setValidationResult(null);

    try {
      const res = await api.validateStore(url, {
        listing_url: url,
        item_container_selector: itemContainer,
        title_selector: titleSelector,
        current_price_selector: currPriceSelector,
        original_price_selector: origPriceSelector,
        category: category
      });
      setValidationResult(res);
    } catch (err) {
      setErrorMsg("تعذر التحقق من الرابط. تأكد من صحة العنوان.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <PlusCircle className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100">إضافة موقع أو متجر جديد (Add Website)</h2>
              <span className="text-[11px] text-slate-400">أدخل فقط اسم المتجر ورابطه لربطه بالرادار فوراً</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Quick 1-Tap Egyptian Presets */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px]">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                متاجر مصرية شهيرة (إضافة بنقرة واحدة):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickStores.map((st) => (
                <button
                  key={st.name}
                  type="button"
                  onClick={() => handleSelectPreset(st)}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/80 font-medium text-[11px] transition-all active:scale-95"
                >
                  + {st.name}
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

          {/* 1. Website / Store Name */}
          <div className="space-y-1.5">
            <label className="text-slate-200 font-bold flex items-center gap-1.5">
              <Store className="w-4 h-4 text-amber-400" />
              <span>اسم المتجر أو الموقع (Website Name):</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: راية شوب، تريد لاين، دريم 2000، كارفور..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-xs sm:text-sm"
              autoFocus
            />
          </div>

          {/* 2. Website / Deals URL */}
          <div className="space-y-1.5">
            <label className="text-slate-200 font-bold flex items-center gap-1.5">
              <Link className="w-4 h-4 text-amber-400" />
              <span>رابط الموقع أو صفحة العروض (Website / Deals Link):</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.rayashop.com أو https://tradeline.net/offers"
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={handleDryRunTest}
                disabled={isValidating || !url.trim()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-300 font-bold rounded-xl border border-slate-700 flex items-center gap-1 shrink-0 text-xs transition-all"
                title="فحص واختبار الرابط"
              >
                {isValidating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>فحص</span>
              </button>
            </div>
          </div>

          {/* Category selection */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">الفئة الرئيسية للمتجر:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500/50"
            >
              <option value="Electronics">إلكترونيات وموبايلات (Electronics)</option>
              <option value="Home & Kitchen">المنزل والمطبخ (Home & Kitchen)</option>
              <option value="Fashion">أزياء وملابس (Fashion)</option>
              <option value="Beauty & Personal Care">عطور وعناية (Beauty)</option>
              <option value="Supermarket">سوبرماركت وأغذية (Supermarket)</option>
              <option value="General">عام / متنوع (General Store)</option>
            </select>
          </div>

          {/* Validation Result Preview Card */}
          {validationResult && (
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{validationResult.message}</span>
              </div>
              {validationResult.sample_items && validationResult.sample_items.length > 0 && (
                <div className="pt-1.5 border-t border-emerald-900/60 space-y-1.5">
                  <span className="text-[10px] text-emerald-300 font-semibold block">عينات تم رصدها بنجاح:</span>
                  {validationResult.sample_items.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-950/60 p-2 rounded-lg">
                      <span className="text-slate-200 truncate max-w-[220px]">{item.title}</span>
                      <span className="text-amber-400 font-bold">{item.current_price.toLocaleString()} ج.م</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Collapsible Advanced Developer Selectors */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-slate-400 hover:text-slate-200 text-[11px] font-medium py-1"
            >
              <span className="flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                <span>إعدادات متقدمة للمطورين (CSS Selectors - اختياري)</span>
              </span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvanced && (
              <div className="mt-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2.5 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-slate-400 text-[10px]">محدد كارت المنتج (Card Selector):</label>
                    <input
                      type="text"
                      value={itemContainer}
                      onChange={(e) => setItemContainer(e.target.value)}
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-slate-400 text-[10px]">محدد العنوان (Title Selector):</label>
                    <input
                      type="text"
                      value={titleSelector}
                      onChange={(e) => setTitleSelector(e.target.value)}
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-slate-400 text-[10px]">محدد السعر الحالي (Price Selector):</label>
                    <input
                      type="text"
                      value={currPriceSelector}
                      onChange={(e) => setCurrPriceSelector(e.target.value)}
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-slate-400 text-[10px]">محدد السعر الأصلي (Old Price):</label>
                    <input
                      type="text"
                      value={origPriceSelector}
                      onChange={(e) => setOrigPriceSelector(e.target.value)}
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !url.trim()}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 disabled:opacity-50 text-slate-950 font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الربط والفحص...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>إضافة المتجر للرادار</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
