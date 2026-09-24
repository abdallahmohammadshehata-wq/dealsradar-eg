import React, { useState } from "react";
import { PlusCircle, X, CheckCircle2, AlertTriangle, Play, Sparkles, Loader2, Globe } from "lucide-react";
import { api } from "../api/client";

export function AddSiteModal({ isOpen, onClose, onStoreCreated }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [category, setCategory] = useState("Electronics");

  // Selectors
  const [itemContainer, setItemContainer] = useState(".product-card");
  const [titleSelector, setTitleSelector] = useState(".product-title");
  const [currPriceSelector, setCurrPriceSelector] = useState(".price-now");
  const [origPriceSelector, setOrigPriceSelector] = useState(".price-was");
  const [imageSelector, setImageSelector] = useState("img");
  const [badgeSelector, setBadgeSelector] = useState(".badge-discount");
  const [linkSelector, setLinkSelector] = useState("a.product-link");

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const applyPreset = (presetKey) => {
    if (presetKey === "generic_ecom") {
      setName("RayaShop Egypt");
      setDomain("rayashop.com");
      setBaseUrl("https://www.rayashop.com");
      setListingUrl("https://www.rayashop.com/en/deals");
      setItemContainer(".product-item");
      setTitleSelector(".product-item-name a");
      setCurrPriceSelector(".special-price .price");
      setOrigPriceSelector(".old-price .price");
      setImageSelector(".product-image-photo");
      setBadgeSelector(".discount-percentage");
      setLinkSelector("a.product-item-photo");
      setCategory("Electronics");
    } else if (presetKey === "cairo_sales") {
      setName("Cairo Sales Stores");
      setDomain("cairosales.com");
      setBaseUrl("https://cairosales.com");
      setListingUrl("https://cairosales.com/en/hot-deals");
      setItemContainer(".product-miniature");
      setTitleSelector(".product-title a");
      setCurrPriceSelector(".current-price");
      setOrigPriceSelector(".regular-price");
      setImageSelector("img.img-fluid");
      setBadgeSelector(".discount-percentage");
      setLinkSelector("a.thumbnail");
      setCategory("Home & Kitchen");
    }
  };

  const handleDryRunTest = async () => {
    if (!listingUrl) {
      setErrorMsg("يرجى إدخال رابط صفحة العروض المستهدفة.");
      return;
    }

    setIsValidating(true);
    setErrorMsg("");
    setValidationResult(null);

    try {
      const res = await api.validateStore(listingUrl, {
        listing_url: listingUrl,
        item_container_selector: itemContainer,
        title_selector: titleSelector,
        current_price_selector: currPriceSelector,
        original_price_selector: origPriceSelector || undefined,
        image_selector: imageSelector || undefined,
        discount_badge_selector: badgeSelector || undefined,
        link_selector: linkSelector || undefined,
        category: category
      });
      setValidationResult(res);
    } catch (err) {
      setErrorMsg("فشل الاتصال بالموقع أو التحقق من العناصر.");
    }
    setIsValidating(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !domain || !baseUrl || !listingUrl) {
      setErrorMsg("يرجى ملء جميع الحقول الإلزامية.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const created = await api.registerStore({
        name,
        domain,
        base_url: baseUrl,
        custom_config: {
          listing_url: listingUrl,
          item_container_selector: itemContainer,
          title_selector: titleSelector,
          current_price_selector: currPriceSelector,
          original_price_selector: origPriceSelector || undefined,
          image_selector: imageSelector || undefined,
          discount_badge_selector: badgeSelector || undefined,
          link_selector: linkSelector || undefined,
          category: category
        }
      });
      setIsSubmitting(false);
      if (onStoreCreated) onStoreCreated(created);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.message || "فشل تسجيل المتجر.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Globe className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100">إضافة متجر وتوسيع الرادار (Add New Website)</h2>
              <span className="text-[11px] text-slate-400">تتبع أي متجر إلكتروني مصري بمحددات CSS مخصصة</span>
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
          
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 p-2 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-bold text-[11px]">نماذج جاهزة:</span>
            <button
              type="button"
              onClick={() => applyPreset("generic_ecom")}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 font-medium text-[11px]"
            >
              + راية شوب (RayaShop)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("cairo_sales")}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-orange-300 border border-slate-700 font-medium text-[11px]"
            >
              + كايرو سيلز (CairoSales)
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">اسم المتجر (Store Name)*</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: RayaShop Egypt"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">النطاق (Domain)*</label>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="مثال: rayashop.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">الفئة الافتراضية</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500/50"
              >
                <option value="Electronics">إلكترونيات</option>
                <option value="Home & Kitchen">المنزل والمطبخ</option>
                <option value="Fashion">أزياء</option>
                <option value="Beauty & Personal Care">عطور وتجميل</option>
                <option value="Supermarket">سوبرماركت</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">رابط الموقع الرئيسي (Base URL)*</label>
              <input
                type="url"
                required
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://www.rayashop.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">رابط صفحة العروض/التخفيضات (Target Deals Page)*</label>
              <input
                type="url"
                required
                value={listingUrl}
                onChange={(e) => setListingUrl(e.target.value)}
                placeholder="https://www.rayashop.com/en/deals"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* CSS Selectors Setup */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800 pb-1.5">
              <span>محددات الاستخراج (CSS Selectors Mapping)</span>
              <span className="text-[10px] text-slate-400 font-normal">لتوجيه البوت نحو عناصر البطاقة</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">حاوية المنتج (Item Container)*</label>
                <input
                  type="text"
                  required
                  value={itemContainer}
                  onChange={(e) => setItemContainer(e.target.value)}
                  placeholder=".product-item, .card"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">عنوان المنتج (Title)*</label>
                <input
                  type="text"
                  required
                  value={titleSelector}
                  onChange={(e) => setTitleSelector(e.target.value)}
                  placeholder=".product-title, h3"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">السعر الحالي (Price Now)*</label>
                <input
                  type="text"
                  required
                  value={currPriceSelector}
                  onChange={(e) => setCurrPriceSelector(e.target.value)}
                  placeholder=".price-now, .special-price"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">السعر الأصلي (Price Was)</label>
                <input
                  type="text"
                  value={origPriceSelector}
                  onChange={(e) => setOrigPriceSelector(e.target.value)}
                  placeholder=".price-old, .regular-price"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">صورة المنتج (Image Selector)</label>
                <input
                  type="text"
                  value={imageSelector}
                  onChange={(e) => setImageSelector(e.target.value)}
                  placeholder="img, .product-image"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">رابط المنتج (Product Link)</label>
                <input
                  type="text"
                  value={linkSelector}
                  onChange={(e) => setLinkSelector(e.target.value)}
                  placeholder="a.product-link, a[href]"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-200"
                />
              </div>
            </div>

            {/* Dry-run Test Trigger */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDryRunTest}
                disabled={isValidating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold border border-amber-500/30 transition-all"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري اختبار الاستخراج...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-amber-400" />
                    <span>فحص تجريبي للمحددات (Dry-Run Test)</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-slate-500">ينصح بإجراء الفحص قبل الحفظ</span>
            </div>
          </div>

          {/* Dry-run validation response preview */}
          {validationResult && (
            <div className={`p-4 rounded-2xl border space-y-2 animate-fadeIn ${
              validationResult.success
                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/30 border-rose-500/40 text-rose-300"
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {validationResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  {validationResult.message}
                </span>
                <span>تم استخراج: {validationResult.items_extracted_count} صفقة</span>
              </div>

              {validationResult.sample_items?.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[11px] text-slate-300 font-bold block">عينات تم التقاطها:</span>
                  {validationResult.sample_items.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 text-[11px] text-slate-300">
                      <span className="line-clamp-1">{item.title}</span>
                      <span className="font-bold text-amber-400 font-['Outfit'] shrink-0 mr-2">{item.current_price} ج.م</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit CTA */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التسجيل والزحف...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>تسجيل المتجر وبدء الزحف الفوري</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
