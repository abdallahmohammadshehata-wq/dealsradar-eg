import React, { useState, useEffect } from "react";
import { 
  Bell, 
  BellRing, 
  Plus, 
  Trash2, 
  X, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  Zap,
  Tag
} from "lucide-react";
import { api } from "../api/client";
import { usePushNotifications } from "../hooks/usePushNotifications";

export function AlertRulesModal({ isOpen, onClose, deviceId }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State for new persistent rule
  const [name, setName] = useState("");
  const [queryText, setQueryText] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [minDiscount, setMinDiscount] = useState(30);
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedStores, setSelectedStores] = useState(["Amazon EG", "Noon EG"]);

  const [customCategories, setCustomCategories] = useState([]);

  const {
    permission,
    isSubscribed,
    loading: pushLoading,
    error: pushError,
    subscribe,
    sendTestNotification
  } = usePushNotifications(deviceId);

  const [testSentMsg, setTestSentMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadRules();
      try {
        const saved = localStorage.getItem("dealsradar_custom_categories");
        if (saved) setCustomCategories(JSON.parse(saved));
      } catch (e) {}
    }
  }, [isOpen, deviceId]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await api.getAlertRules(deviceId);
      setRules(data || []);
    } catch (e) {}
    setLoading(false);
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      const rule = await api.createAlertRule({
        device_id: deviceId,
        name: name || undefined,
        query_text: queryText || undefined,
        category: category !== "All" ? category : undefined,
        min_discount: parseFloat(minDiscount),
        max_price: maxPrice ? parseFloat(maxPrice) : undefined,
        stores: selectedStores.length > 0 ? selectedStores : undefined
      });

      // Immediately evaluate existing deals for this rule
      try {
        const dealsData = await api.getDeals({});
        const items = dealsData.items || [];
        const matches = items.filter(d => {
          const matchDiscount = !rule.min_discount || d.discount_percent >= rule.min_discount;
          const matchPrice = !rule.max_price || d.current_price <= rule.max_price;
          const matchStore = !rule.stores?.length || rule.stores.includes(d.store_name);
          const matchCat = !rule.category || d.category.toLowerCase().includes(rule.category.toLowerCase());
          const matchQuery = !rule.query_text || (d.title + " " + (d.title_ar || "")).toLowerCase().includes(rule.query_text.toLowerCase());
          return matchDiscount && matchPrice && matchStore && (matchCat || matchQuery);
        });

        if (matches.length > 0) {
          const topMatch = matches[0];
          await api.sendTestPush(
            deviceId,
            `🎯 رادار مصر: عثرنا على صفقة تطابق '${rule.name}'!`,
            `${topMatch.title_ar || topMatch.title} بسعر ${topMatch.current_price.toLocaleString()} ج.م (خصم ${topMatch.discount_percent.toFixed(0)}%)`
          );
        }
      } catch (evalErr) {}

      setIsCreating(false);
      setName("");
      setQueryText("");
      setMaxPrice("");
      setTestSentMsg("✅ تم تفعيل قاعدة التنبيه بنجاح!");
      setTimeout(() => setTestSentMsg(""), 4000);
      loadRules();
    } catch (err) {
      alert("فشل إنشاء قاعدة التنبيه.");
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await api.deleteAlertRule(ruleId);
      setRules(rules.filter(r => r.id !== ruleId));
    } catch (err) {
      alert("فشل حذف القاعدة.");
    }
  };

  const handleSendTestPush = async () => {
    setTestSentMsg("");
    try {
      const res = await sendTestNotification();
      setTestSentMsg(res.message || "🚀 تم إرسال الإشعار وتجربته بنجاح!");
      setTimeout(() => setTestSentMsg(""), 5000);
    } catch (e) {
      setTestSentMsg("تمت الإضافة لمركز الإشعارات الداخلي للتطبيق.");
      setTimeout(() => setTestSentMsg(""), 5000);
    }
  };

  if (!isOpen) return null;

  const storesList = ["Amazon EG", "Noon EG", "Jumia EG", "B.TECH Egypt", "2B Egypt"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <BellRing className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-100">قواعد التنبيهات المخصصة والإشعارات الفورية</h2>
              <span className="text-[11px] text-slate-400">تنبيهات خلفية مستقلة (Web Push Engine)</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Push Permission & Status Card */}
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className={`p-2 rounded-xl ${isSubscribed ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <span>حالة إشعارات المتصفح (Web Push):</span>
                  {isSubscribed ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">مفعلة ✅</span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">جاهزة للتفعيل</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  تصلك التنبيهات حتى عند إغلاق التطبيق في الخلفية فور رصد الهبوط.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!isSubscribed ? (
                <button
                  onClick={subscribe}
                  disabled={pushLoading}
                  className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all"
                >
                  {pushLoading ? "جاري التفعيل..." : "تفعيل الإشعارات"}
                </button>
              ) : (
                <button
                  onClick={handleSendTestPush}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>إرسال تنبيه تجريبي</span>
                </button>
              )}
            </div>
          </div>

          {testSentMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{testSentMsg}</span>
            </div>
          )}

          {/* Cooldown Protection Notice */}
          <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>نظام الحماية من الإزعاج: يتم تقييد التنبيهات المكررة بفاصل 24 ساعة لكل منتج لمنع الرسائل المتكررة.</span>
          </div>

          {/* Create Rule Form / Button */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>إنشاء قاعدة تنبيه ذكية جديدة (+ Add Custom Rule)</span>
            </button>
          ) : (
            <form onSubmit={handleCreateRule} className="p-4 bg-slate-950/90 rounded-2xl border border-amber-500/40 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800 pb-2">
                <span>تحديد معايير التنبيه الخلفي</span>
                <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">اسم القاعدة (اختياري):</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: شاشات سامسونج 55 بوصة"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">الكلمات المفتاحية في العنوان:</label>
                  <input
                    type="text"
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder="مثال: Samsung, Coffee, Air Fryer"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">الفئة المستهدفة:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="All">جميع الفئات</option>
                    <option value="Electronics">إلكترونيات (Electronics)</option>
                    <option value="Home & Kitchen">المنزل والمطبخ (Home & Kitchen)</option>
                    <option value="Fashion">أزياء وموضة (Fashion)</option>
                    <option value="Beauty & Personal Care">عناية وعطور (Beauty)</option>
                    <option value="Supermarket">سوبرماركت (Supermarket)</option>
                    {customCategories.map((c) => (
                      <option key={c} value={c}>🌟 {c} (فئة خاصة)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-slate-300 font-medium">أدنى نسبة خصم:</label>
                    <span className="text-amber-400 font-bold">{minDiscount}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={minDiscount}
                    onChange={(e) => setMinDiscount(e.target.value)}
                    className="w-full accent-amber-500 bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">الحد الأقصى للسعر (ج.م):</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="مثال: 15000"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">المتاجر المشمولة بالتنبيه:</label>
                <div className="flex flex-wrap gap-1.5">
                  {storesList.map((store) => {
                    const isChecked = selectedStores.includes(store);
                    return (
                      <button
                        key={store}
                        type="button"
                        onClick={() => {
                          if (isChecked) setSelectedStores(selectedStores.filter(s => s !== store));
                          else setSelectedStores([...selectedStores, store]);
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                          isChecked
                            ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                            : "bg-slate-900 border-slate-800 text-slate-500"
                        }`}
                      >
                        {store}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                >
                  حفظ وتفعيل التنبيه
                </button>
              </div>
            </form>
          )}

          {/* Active Rules List */}
          <div className="space-y-2 pt-2">
            <h3 className="font-bold text-slate-300 text-xs">قواعد التنبيه النشطة لجهازك ({rules.length}):</h3>
            
            {loading ? (
              <div className="text-center py-6 text-slate-500">جاري تحميل القواعد...</div>
            ) : rules.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/40 rounded-2xl border border-slate-800/80 p-4 space-y-1">
                <Bell className="w-6 h-6 text-slate-600 mx-auto" />
                <div className="text-slate-400 font-semibold">لا توجد قواعد تنبيه نشطة حالياً</div>
                <div className="text-slate-500 text-[11px]">أنشئ قاعدة لتصلك الإشعارات فور حدوث هبوط مفاجئ في الأسعار.</div>
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <h4 className="font-bold text-slate-100 text-xs">{rule.name}</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                      {rule.category && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          فئة: {rule.category}
                        </span>
                      )}
                      {rule.query_text && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                          كلمة: "{rule.query_text}"
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                        خصم ≥ {rule.min_discount}%
                      </span>
                      {rule.max_price && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          أقل من {rule.max_price.toLocaleString()} ج.م
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all"
                    title="حذف القاعدة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
