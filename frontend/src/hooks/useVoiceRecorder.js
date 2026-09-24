import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api/client";

export function useVoiceRecorder(onResultParsed) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "ar-EG"; // Default Egyptian Arabic with English fallback

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setError(`خطأ في التعرف الصوتي: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = async () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = useCallback((lang = "ar-EG") => {
    setError(null);
    setTranscript("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
      } catch (e) {
        // already started
      }
    } else {
      // Fallback for browsers without Web Speech API
      setError("التعرف الصوتي غير مدعوم في هذا المتصفح. يمكنك كتابة النص وسيقوم الذكاء الاصطناعي بتحليله.");
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, []);

  const submitTranscript = useCallback(async (textToParse) => {
    const targetText = textToParse || transcript;
    if (!targetText.trim()) return null;

    setIsProcessing(true);
    setError(null);
    try {
      const parsed = await api.parseVoice(targetText);
      setIsProcessing(false);
      if (onResultParsed) {
        onResultParsed(parsed);
      }
      return parsed;
    } catch (err) {
      setIsProcessing(false);
      setError("فشل تحليل الأمر الصوتي. حاول مرة أخرى.");
      return null;
    }
  }, [transcript, onResultParsed]);

  return {
    isListening,
    transcript,
    setTranscript,
    isProcessing,
    error,
    startListening,
    stopListening,
    submitTranscript
  };
}
