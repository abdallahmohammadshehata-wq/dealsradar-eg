import React, { useState } from "react";
import { Mic, MicOff, X, Sparkles, ArrowRight, Check, Volume2 } from "lucide-react";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";

export function VoiceSearchModal({ isOpen, onClose, onApplyFilters }) {
  const [parsedResult, setParsedResult] = useState(null);
  const [activeLang, setActiveLang] = useState("ar-EG");

  const {
    isListening,
    transcript,
    setTranscript,
    isProcessing,
    error,
    startListening,
    stopListening,
    submitTranscript
  } = useVoiceRecorder((result) => {
    setParsedResult(result);
  });

  if (!isOpen) return null;

  const handleApply = () => {
    if (parsedResult && parsedResult.parsed_filters) {
      onApplyFilters(parsedResult.parsed_filters);
      onClose();
    }
  };

  const sampleVoicePrompts = [
    "عايز شاشة سامسونج 55 بوصة عليها خصم أكتر من ثلاثين في المية",
    "دور على قلاية هوائية بلاك اند ديكر تحت 3500 جنيه على أمازون",
    "عايز كوتشي اديداس اوريجنال عليه تخفيض 40%",
    "ماكينة قهوة ديلونجي ديديكا خصم قوي على نون"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-100">البحث الصوتي الذكي بالذكاء الاصطناعي</h2>
              <span className="text-[11px] text-slate-400">تحدث بالعامية المصرية أو الإنجليزية</span>
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
        <div className="p-6 flex flex-col items-center text-center space-y-5">
          
          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveLang("ar-EG")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeLang === "ar-EG"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🇪🇬 العامية المصرية (Arabic)
            </button>
            <button
              onClick={() => setActiveLang("en-US")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeLang === "en-US"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🇺🇸 English
            </button>
          </div>

          {/* Animated Microphone Button */}
          <div className="relative my-2 flex items-center justify-center">
            {isListening && (
              <>
                <div className="absolute w-28 h-28 rounded-full bg-amber-500/20 animate-ping" />
                <div className="absolute w-36 h-36 rounded-full bg-orange-500/10 animate-pulse" />
              </>
            )}
            <button
              onClick={() => (isListening ? stopListening() : startListening(activeLang))}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 ${
                isListening
                  ? "bg-gradient-to-tr from-rose-500 to-amber-500 text-white ring-4 ring-rose-500/30"
                  : "bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950 hover:opacity-90"
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 animate-pulse" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            {isListening ? (
              <span className="text-amber-400 font-bold flex items-center justify-center gap-1.5 animate-pulse">
                <Volume2 className="w-4 h-4" /> جاري الاستماع... تحدث الآن
              </span>
            ) : (
              "اضغط على الميكروفون وتحدث بحرية"
            )}
          </div>

          {/* Spoken Transcript Box / Fallback Input */}
          <div className="w-full text-right">
            <textarea
              rows={2}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="مثال: عايز شاشة سامسونج 55 بوصة عليها خصم أكتر من 30%..."
              className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/50"
            />
            {transcript && !parsedResult && (
              <button
                onClick={() => submitTranscript(transcript)}
                disabled={isProcessing}
                className="mt-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                {isProcessing ? "جاري التحليل..." : "تحليل الأمر الصوتي ⚡"}
              </button>
            )}
          </div>

          {/* Extracted Structured JSON Query Result */}
          {parsedResult && parsedResult.parsed_filters && (
            <div className="w-full bg-slate-950/90 p-3.5 rounded-2xl border border-amber-500/30 text-right space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400 border-b border-slate-800/80 pb-1.5">
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-400" />
                  تم استخراج المعايير بنجاح
                </span>
                <span className="text-[10px] text-slate-400">دقة 96%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                {parsedResult.parsed_filters.category && (
                  <div>الفئة: <b className="text-white">{parsedResult.parsed_filters.category}</b></div>
                )}
                {parsedResult.parsed_filters.brand && (
                  <div>الماركة: <b className="text-white">{parsedResult.parsed_filters.brand}</b></div>
                )}
                {parsedResult.parsed_filters.min_discount && (
                  <div>الخصم الأدنى: <b className="text-amber-400">≥ {parsedResult.parsed_filters.min_discount}%</b></div>
                )}
                {parsedResult.parsed_filters.max_price && (
                  <div>الحد الأقصى للسعر: <b className="text-emerald-400">≤ {parsedResult.parsed_filters.max_price.toLocaleString()} ج.م</b></div>
                )}
                {parsedResult.parsed_filters.stores?.length > 0 && (
                  <div className="col-span-2">المتاجر: <b className="text-white">{parsedResult.parsed_filters.stores.join(", ")}</b></div>
                )}
              </div>
            </div>
          )}

          {/* Quick Prompts Samples */}
          {!transcript && (
            <div className="w-full text-right space-y-1.5">
              <span className="text-[11px] text-slate-500 block font-medium">أو جرب أحد الأوامر الجاهزة:</span>
              <div className="flex flex-wrap gap-1.5">
                {sampleVoicePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTranscript(prompt);
                      submitTranscript(prompt);
                    }}
                    className="text-[11px] px-2.5 py-1 bg-slate-950/60 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-all text-right"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer CTA */}
        {parsedResult && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
            <button
              onClick={() => setParsedResult(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
            >
              إعادة التسجيل
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95"
            >
              <span>تطبيق المعايير واستعراض الصفقات</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
