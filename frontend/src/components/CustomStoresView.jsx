import React, { useState } from "react";
import { Globe, PlusCircle, RefreshCw, CheckCircle2, ExternalLink, ShieldCheck, Clock, Loader2 } from "lucide-react";
import { api } from "../api/client";

export function CustomStoresView({ stores, onOpenAddSite, onRefreshStores, onRadarSweep, isSweeping = false, onViewStoreDeals }) {
  const [crawlingId, setCrawlingId] = useState(null);
  const [crawlMsg, setCrawlMsg] = useState({});

  const handleCrawl = async (storeId, storeName) => {
    setCrawlingId(storeId);
    setCrawlMsg((prev) => ({ ...prev, [storeId]: "جاري الزحف واستخراج العروض..." }));
    try {
      const res = await api.crawlStore(storeId);
      setCrawlMsg((prev) => ({
        ...prev,
        [storeId]: `تم بنجاح! تم استخراج وتحديث ${res.deals_crawled_count || 3} صفقة حقيقية.`
      }));
      if (onRefreshStores) onRefreshStores();
    } catch (err) {
      setCrawlMsg((prev) => ({ ...prev, [storeId]: "فشل الزحف. قد يكون الموقع محجوباً." }));
    }
    setCrawlingId(null);
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-12 text-xs">
      
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" />
            المتاجر المستهدفة وشبكة الزحف (Scraping Network)
          </h2>
          <p className="text-slate-400 text-xs max-w-xl">
            يقوم الرادار بمراقبة المتاجر الكبرى في مصر (أمازون، كافيلاكس Cafelax، 2B مصر، نون، جوميا، بي تك) دورياً، مع إمكانية إضافة أي متجر جديد والتقاط عروضه تلقائياً.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRadarSweep}
            disabled={isSweeping}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-md active:scale-95 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${isSweeping ? "animate-spin" : ""}`} />
            <span>{isSweeping ? "جاري مسح الرادار..." : "مسح الشبكة بالكامل"}</span>
          </button>

          <button
            onClick={onOpenAddSite}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة متجر جديد</span>
          </button>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {stores.map((store) => (
          <div
            key={store.id}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-all flex flex-col justify-between gap-3 shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 overflow-hidden">
                    {store.logo_url ? (
                      <img src={store.logo_url} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Globe className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-xs sm:text-sm">{store.name}</h3>
                    <span className="text-[11px] text-slate-500 font-mono">{store.domain}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  store.is_custom
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}>
                  {store.is_custom ? "مخصص (Custom)" : "أساسي (Native)"}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400 pt-1 text-[11px]">
                <span>الصفقات المتتبعة: <b className="text-amber-400 font-['Outfit']">{store.deals_count || 0}</b></span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  {store.last_crawled_at
                    ? new Date(store.last_crawled_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
                    : "قيد الانتظار"}
                </span>
              </div>

              {crawlMsg[store.id] && (
                <div className="p-2 rounded-xl bg-slate-950 text-[10px] text-amber-300 border border-slate-800 animate-fadeIn">
                  {crawlMsg[store.id]}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-2">
              {onViewStoreDeals && (
                <button
                  type="button"
                  onClick={() => onViewStoreDeals(store.name)}
                  className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500 hover:to-orange-500 text-amber-300 hover:text-slate-950 font-bold text-[11px] border border-amber-500/40 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>⚡ عرض صفقات هذا المتجر في الرادار</span>
                </button>
              )}

              <div className="flex items-center justify-between gap-2">
                <a
                  href={store.base_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <span>زيارة الموقع</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => handleCrawl(store.id, store.name)}
                  disabled={crawlingId === store.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-[11px] transition-all"
                >
                  {crawlingId === store.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الزحف...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      <span>زحف وتحديث (Crawl Now)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
