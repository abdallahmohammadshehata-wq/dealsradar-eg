import React, { useState, useRef } from "react";
import { Camera, UploadCloud, X, Sparkles, Check, ArrowRight, Tag, Loader2 } from "lucide-react";
import { api } from "../api/client";

export function ImageSearchModal({ isOpen, onClose, onSelectDealMatch }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target.result;
      setImagePreview(base64);
      processImage(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64, filename) => {
    setIsProcessing(true);
    try {
      const res = await api.parseImage(base64, filename);
      setParseResult(res);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
    }
  };

  const handleDemoPreset = (presetName, sampleUrl, filename) => {
    setImagePreview(sampleUrl);
    processImage(sampleUrl, filename);
  };

  const demoSamples = [
    {
      name: "شاشة سامسونج",
      filename: "samsung_tv_box.jpg",
      img: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=300&q=80"
    },
    {
      name: "حذاء اديداس",
      filename: "adidas_running_shoes.jpg",
      img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80"
    },
    {
      name: "ماكينة اسبريسو",
      filename: "delonghi_espresso_coffee.jpg",
      img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80"
    },
    {
      name: "عطر ديور سوفاج",
      filename: "dior_sauvage_perfume.jpg",
      img: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=300&q=80"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-orange-500/20">
              <Camera className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-100">البحث البصري بالصورة (Visual AI Search)</h2>
              <span className="text-[11px] text-slate-400">التقط صورة لمنتج أو ارفعها للبحث عن أقوى العروض</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Uploader Box */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-all space-y-2 group"
            >
              <div className="p-3 rounded-full bg-slate-900 group-hover:bg-amber-500/10 text-slate-400 group-hover:text-amber-400 transition-colors">
                <UploadCloud className="w-8 h-8" />
              </div>
              <span className="font-bold text-slate-200">اسحب وأفلت صورة المنتج هنا أو انقر للتصوير</span>
              <span className="text-[11px] text-slate-500">يدعم صيغ JPG، PNG، WEBP حتى 5 ميجابايت</span>
            </div>
          ) : (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-2" />
              <button
                onClick={() => {
                  setImagePreview(null);
                  setParseResult(null);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-white hover:bg-rose-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-amber-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="font-bold text-xs">جاري التعرف على الموديل والنصوص (OCR)...</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Demo Sample Badges */}
          {!imagePreview && (
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-medium">أو جرب إحدى الصور التجريبية:</span>
              <div className="grid grid-cols-4 gap-2">
                {demoSamples.map((demo, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDemoPreset(demo.name, demo.img, demo.filename)}
                    className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 text-center transition-all flex flex-col items-center gap-1 group"
                  >
                    <img src={demo.img} alt="" className="w-10 h-10 object-contain rounded-md" />
                    <span className="text-[10px] text-slate-300 font-medium line-clamp-1">{demo.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Visual AI Recognition Results */}
          {parseResult && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800/80 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    المنتج المكتشف (Detected Product)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                    دقة {Math.round(parseResult.confidence * 100)}%
                  </span>
                </div>

                <div className="text-slate-100 font-extrabold text-sm">
                  {parseResult.detected_product_ar || parseResult.detected_product}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
                    الفئة: <b>{parseResult.predicted_category}</b>
                  </span>
                  {parseResult.detected_brand && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 text-[11px]">
                      الماركة: <b>{parseResult.detected_brand}</b>
                    </span>
                  )}
                </div>

                {parseResult.extracted_text_ocr?.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block mb-1">الكلمات المفتاحية المستخرجة (OCR):</span>
                    <div className="flex flex-wrap gap-1">
                      {parseResult.extracted_text_ocr.map((tag, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] border border-slate-800 font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
          >
            إغلاق
          </button>
          {parseResult && (
            <button
              onClick={() => {
                onSelectDealMatch({
                  category: parseResult.predicted_category,
                  brand: parseResult.detected_brand,
                  search: parseResult.detected_brand || ""
                });
                onClose();
              }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95"
            >
              <span>عرض الصفقات المطابقة</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
