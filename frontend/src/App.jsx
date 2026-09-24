import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { 
  Flame, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  Layers, 
  Filter, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  ShieldCheck,
  Zap,
  ShoppingBag
} from "lucide-react";

import { api } from "./api/client";
import { useDeviceId } from "./hooks/useDeviceId";

// Components
import { Navbar } from "./components/Navbar";
import { DualFilterBar } from "./components/DualFilterBar";
import { DealCard } from "./components/DealCard";
import { PriceHistoryModal } from "./components/PriceHistoryModal";
import { VoiceSearchModal } from "./components/VoiceSearchModal";
import { ImageSearchModal } from "./components/ImageSearchModal";
import { AlertRulesModal } from "./components/AlertRulesModal";
import { NotificationDrawer } from "./components/NotificationDrawer";
import { AddSiteModal } from "./components/AddSiteModal";
import { AnalyticsView } from "./components/AnalyticsView";
import { CustomStoresView } from "./components/CustomStoresView";
import { WatchlistView } from "./components/WatchlistView";
import { BottomNav } from "./components/BottomNav";

export function App() {
  const deviceId = useDeviceId();

  // Navigation state: "feed" | "watchlist" | "alerts" | "stores" | "analytics"
  const [activeTab, setActiveTab] = useState("feed");

  // Modals state
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [selectedHistoryDeal, setSelectedHistoryDeal] = useState(null);

  // Theme state
  const [theme, setTheme] = useState("dark");

  // Unread notification count
  const [unreadCount, setUnreadCount] = useState(0);

  // Feed Filter state (Transient View Filters)
  const [filters, setFilters] = useState({
    page: 1,
    page_size: 20,
    min_discount: null,
    min_price: null,
    max_price: null,
    stores: [],
    category: "All",
    brand: null,
    search: "",
    is_all_time_low: false,
    is_flash_sale: false,
    sort_by: "discount_desc"
  });

  // Deals Feed State
  const [deals, setDeals] = useState([]);
  const [totalDeals, setTotalDeals] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Metadata & Stores State
  const [marketStats, setMarketStats] = useState(null);
  const [stores, setStores] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([
    "All", "Electronics", "Home & Kitchen", "Fashion", "Beauty & Personal Care", "Supermarket"
  ]);

  // Watchlist State (stored in localStorage)
  const [watchedDeals, setWatchedDeals] = useState(() => {
    try {
      const saved = localStorage.getItem("dealsradar_watchlist");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Dismissed Deal IDs (to support swipe to dismiss)
  const [dismissedIds, setDismissedIds] = useState([]);

  // Save watchlist
  useEffect(() => {
    try {
      localStorage.setItem("dealsradar_watchlist", JSON.stringify(watchedDeals));
    } catch (e) {}
  }, [watchedDeals]);

  // Load stores and market stats on initial mount
  useEffect(() => {
    loadMetadata();
    loadNotificationCount();
  }, [deviceId]);

  const loadMetadata = async () => {
    try {
      const [statsData, storesData] = await Promise.all([
        api.getStats(),
        api.getStores()
      ]);
      setMarketStats(statsData);
      setStores(storesData || []);
    } catch (err) {
      console.warn("Failed to load initial metadata:", err);
    }
  };

  const loadNotificationCount = async () => {
    try {
      const notifs = await api.getNotifications(deviceId);
      const unread = (notifs || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (e) {}
  };

  // Fetch Deals based on current filters
  const loadDeals = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await api.getDeals(filters);
      setDeals(data.items || []);
      setTotalDeals(data.total || 0);
      setTotalPages(data.total_pages || 1);
      if (data.categories && data.categories.length) {
        setAvailableCategories(["All", ...data.categories]);
      }
    } catch (err) {
      console.error("Failed to load deals:", err);
      setError("تعذر تحميل الصفقات حالياً. تأكد من تشغيل السيرفر أو الاتصال بالإنترنت.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      page_size: 20,
      min_discount: null,
      min_price: null,
      max_price: null,
      stores: [],
      category: "All",
      brand: null,
      search: "",
      is_all_time_low: false,
      is_flash_sale: false,
      sort_by: "discount_desc"
    });
  };

  // Toggle Watch Deal
  const handleToggleWatch = (deal) => {
    const isAlreadyWatched = watchedDeals.some(d => d.id === deal.id);
    if (isAlreadyWatched) {
      setWatchedDeals(watchedDeals.filter(d => d.id !== deal.id));
    } else {
      setWatchedDeals([deal, ...watchedDeals]);
      // Trigger festive micro-confetti
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#f59e0b", "#f97316", "#10b981"]
        });
      } catch (e) {}
    }
  };

  // Dismiss a deal
  const handleDismissDeal = (dealId) => {
    setDismissedIds((prev) => [...prev, dealId]);
  };

  // Apply NLP Voice / Visual search filters
  const handleApplyAIFilters = (aiFilters) => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      category: aiFilters.category || prev.category,
      brand: aiFilters.brand || null,
      search: aiFilters.query || aiFilters.search || prev.search,
      min_discount: aiFilters.min_discount || prev.min_discount,
      max_price: aiFilters.max_price || prev.max_price,
      stores: aiFilters.stores?.length ? aiFilters.stores : prev.stores
    }));
    setActiveTab("feed");
  };

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
  };

  const visibleDeals = deals.filter(d => !dismissedIds.includes(d.id));

  return (
    <div className={`min-h-screen flex flex-col ${theme === "light" ? "light bg-slate-50 text-slate-900" : "bg-slate-950 text-slate-100"}`}>
      
      {/* 1. Sticky Top Navbar */}
      <Navbar
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotifsOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenImage={() => setIsImageOpen(true)}
        onOpenAddSite={() => setIsAddSiteOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        stats={marketStats}
      />

      {/* 2. Desktop Navigation Pills */}
      <div className="hidden sm:block border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[
              { id: "feed", label: "🔥 جميع الصفقات (Deals Feed)" },
              { id: "watchlist", label: `⭐ المفضلة والمراقبة (${watchedDeals.length})` },
              { id: "alerts", label: "🔔 قواعد التنبيه الخلفية (Alert Rules)" },
              { id: "stores", label: `🌐 شبكة المتاجر (${stores.length})` },
              { id: "analytics", label: "📊 رادار السوق والإحصائيات (Radar Analytics)" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "alerts") setIsAlertsOpen(true);
                  else setActiveTab(tab.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDeals(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-all"
              title="تحديث الصفقات"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${refreshing ? "animate-spin" : ""}`} />
              <span>تحديث</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Transient Dual-Filter Bar (Only visible in Feed View) */}
      {activeTab === "feed" && (
        <DualFilterBar
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
          availableStores={stores.map(s => s.name)}
          availableCategories={availableCategories}
        />
      )}

      {/* 4. Main Body Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 pb-24 sm:pb-12">
        
        {/* VIEW: Deals Feed */}
        {activeTab === "feed" && (
          <div className="space-y-5 animate-fadeIn">
            
            {/* Feed Header / Status Info */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="font-bold text-slate-200">
                  تم العثور على <b className="text-amber-400 font-['Outfit']">{totalDeals}</b> صفقة
                </span>
                {filters.min_discount && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                    خصم ≥ {filters.min_discount}%
                  </span>
                )}
                {filters.category !== "All" && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                    {filters.category}
                  </span>
                )}
              </div>

              {/* Mobile Refresh Button */}
              <button
                onClick={() => loadDeals(true)}
                className="sm:hidden p-1.5 rounded-lg bg-slate-900 text-amber-400 border border-slate-800"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => loadDeals(true)}
                  className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white font-bold"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            {/* Loading Skeletons */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-80 bg-slate-900/60 rounded-2xl border border-slate-800/80 animate-pulse p-4 space-y-3">
                    <div className="w-full aspect-[4/3] bg-slate-950/80 rounded-xl" />
                    <div className="w-2/3 h-4 bg-slate-800 rounded" />
                    <div className="w-full h-3 bg-slate-800 rounded" />
                    <div className="w-1/2 h-6 bg-slate-800 rounded mt-4" />
                  </div>
                ))}
              </div>
            ) : visibleDeals.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center mx-auto text-slate-600">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="text-slate-200 font-bold text-sm">لم يتم العثور على صفقات تطابق هذه الفلاتر</h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  حاول خفض نسبة الخصم المطلوبة أو توسيع نطاق الأسعار أو البحث بكلمات أخرى.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
                >
                  إعادة ضبط الفلاتر
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {visibleDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    isWatched={watchedDeals.some(d => d.id === deal.id)}
                    onToggleWatch={handleToggleWatch}
                    onOpenHistory={(d) => setSelectedHistoryDeal(d)}
                    onDismiss={handleDismissDeal}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-6 flex items-center justify-center gap-2 text-xs">
                <button
                  disabled={filters.page <= 1}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-slate-200 border border-slate-800 flex items-center gap-1 font-bold"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                <div className="px-4 py-2 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 font-bold">
                  صفحة {filters.page} من {totalPages}
                </div>

                <button
                  disabled={filters.page >= totalPages}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-slate-200 border border-slate-800 flex items-center gap-1 font-bold"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        )}

        {/* VIEW: Watchlist */}
        {activeTab === "watchlist" && (
          <WatchlistView
            watchedDeals={watchedDeals}
            onToggleWatch={handleToggleWatch}
            onOpenHistory={(d) => setSelectedHistoryDeal(d)}
          />
        )}

        {/* VIEW: Custom Stores Network */}
        {activeTab === "stores" && (
          <CustomStoresView
            stores={stores}
            onOpenAddSite={() => setIsAddSiteOpen(true)}
            onRefreshStores={loadMetadata}
          />
        )}

        {/* VIEW: Market Radar Analytics */}
        {activeTab === "analytics" && (
          <AnalyticsView
            stats={marketStats}
            onOpenHistory={(d) => setSelectedHistoryDeal(d)}
            onToggleWatch={handleToggleWatch}
          />
        )}

      </main>

      {/* 5. Mobile Sticky Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === "alerts") setIsAlertsOpen(true);
          else setActiveTab(tab);
        }}
        watchedCount={watchedDeals.length}
      />

      {/* 6. Modals & Drawers */}
      <PriceHistoryModal
        deal={selectedHistoryDeal}
        onClose={() => setSelectedHistoryDeal(null)}
      />

      <VoiceSearchModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onApplyFilters={handleApplyAIFilters}
      />

      <ImageSearchModal
        isOpen={isImageOpen}
        onClose={() => setIsImageOpen(false)}
        onSelectDealMatch={handleApplyAIFilters}
      />

      <AlertRulesModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        deviceId={deviceId}
      />

      <NotificationDrawer
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        deviceId={deviceId}
        onNotificationCountChange={setUnreadCount}
      />

      <AddSiteModal
        isOpen={isAddSiteOpen}
        onClose={() => setIsAddSiteOpen(false)}
        onStoreCreated={() => {
          loadMetadata();
          loadDeals(true);
        }}
      />

    </div>
  );
}
