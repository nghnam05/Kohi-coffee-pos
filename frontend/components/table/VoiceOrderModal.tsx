'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface ParsedVoiceItem {
  foodId: string;
  foodName: string;
  quantity: number;
  size: 'S' | 'M' | 'L';
  unitPrice: number;
  ice?: string;
  sugar?: string;
  note: string;
}

interface VoiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItemsToCart: (items: ParsedVoiceItem[], isTakeaway: boolean) => void;
  onViewFoodDetail?: (item: ParsedVoiceItem) => void;
  lang?: 'vi' | 'en' | 'zh';
}

export const VoiceOrderModal: React.FC<VoiceOrderModalProps> = ({
  isOpen,
  onClose,
  onAddItemsToCart,
  onViewFoodDetail,
  lang = 'vi',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<{
    isTakeaway: boolean;
    items: ParsedVoiceItem[];
    aiReply: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Khởi tạo SpeechRecognition nếu trình duyệt hỗ trợ
  const startListening = useCallback(() => {
    setErrorMsg(null);
    setParsedResult(null);
    setTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói Web Speech. Vui lòng sử dụng Chrome, Edge hoặc Safari.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : 'vi-VN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        const clean = currentTranscript.trim();
        setTranscript(clean);

        // Reset silence timer: sau 2.5s không có tiếng mới -> tự động dừng và gửi phân tích
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (clean.length > 3) {
            stopListeningAndParse(clean);
          }
        }, 2500);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          return;
        }
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Vui lòng cấp quyền truy cập Microphone cho trình duyệt để gọi món bằng giọng nói.');
        } else {
          setErrorMsg(`Lỗi micro (${event.error}). Vui lòng thử lại.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Lỗi khi kích hoạt micro:', err);
      setErrorMsg('Không thể kích hoạt Micro. Vui lòng thử lại.');
      setIsListening(false);
    }
  }, [lang]);

  const stopListeningAndParse = useCallback(async (textToParse?: string) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);

    const text = (textToParse || transcript).trim();
    if (!text) {
      setErrorMsg('Chưa nhận diện được giọng nói. Bạn hãy thử nói lại nhé.');
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/ai-chat/parse-voice-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, lang }),
      });

      if (res.ok) {
        const data = await res.json();
        setParsedResult(data);
      } else {
        setErrorMsg('Không thể xử lý giọng nói lúc này. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Lỗi gọi API parse-voice-order:', err);
      setErrorMsg('Lỗi kết nối máy chủ khi bóc tách món.');
    } finally {
      setIsParsing(false);
    }
  }, [transcript, lang]);

  // Tự động bật nghe khi Modal mở ra
  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      setIsListening(false);
      setTranscript('');
      setParsedResult(null);
      setErrorMsg(null);
    }
  }, [isOpen, startListening]);

  const handleConfirmAdd = () => {
    if (parsedResult && parsedResult.items.length > 0) {
      onAddItemsToCart(parsedResult.items, parsedResult.isTakeaway);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-lg bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-sky-500/10 dark:bg-sky-400/10 flex items-center justify-center text-[#38BDF8]">
                <span className="material-symbols-outlined text-xl">mic</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Gọi Món Bằng Giọng Nói (Kohi AI)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  Nói tự nhiên, AI tự động thêm vào giỏ hàng
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center">
            {/* Pulsing Mic Button & Waveform */}
            <div className="relative my-4 flex flex-col items-center">
              {isListening && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full bg-[#38BDF8]/20 -m-3"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.2, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full bg-[#38BDF8]/30 -m-1.5"
                  />
                </>
              )}

              <button
                onClick={() => {
                  if (isListening) {
                    stopListeningAndParse();
                  } else {
                    startListening();
                  }
                }}
                disabled={isParsing}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all ${
                  isListening
                    ? 'bg-[#38BDF8] text-white shadow-sky-500/30 scale-105'
                    : 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-sky-500 dark:hover:bg-[#38BDF8] hover:shadow-sky-500/20'
                }`}
              >
                <span className="material-symbols-outlined text-3xl">
                  {isListening ? 'graphic_eq' : 'mic'}
                </span>
              </button>
            </div>

            {/* Status Label & Audio Waveform */}
            <div className="text-center mb-4">
              {isParsing ? (
                <div className="flex items-center justify-center gap-2 text-sm font-extrabold text-[#38BDF8]">
                  <span className="material-symbols-outlined text-base animate-spin">rotate_right</span>
                  <span>Kohi AI đang bóc tách món ăn...</span>
                </div>
              ) : isListening ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1.5 h-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: ['8px', '22px', '8px'] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.6,
                          delay: i * 0.12,
                          ease: 'easeInOut',
                        }}
                        className="w-1 bg-[#38BDF8] rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#38BDF8]">
                    Đang lắng nghe... Hãy nói món bạn muốn gọi!
                  </span>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Ví dụ: &quot;Cho 2 ly Matcha dâu size L ít đá và 1 bánh tart trứng mang về&quot;
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Bấm vào Micro để bắt đầu nói
                  </span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="w-full p-3 mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-medium text-center">
                {errorMsg}
              </div>
            )}

            {/* Realtime Live Transcript Box */}
            {transcript && (
              <div className="w-full p-4 mb-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  Giọng nói nhận diện:
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic">
                  &ldquo;{transcript}&rdquo;
                </p>
              </div>
            )}

            {/* Parsed Result Display */}
            {parsedResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-3"
              >
                {/* AI Assistant Reply */}
                <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/40 text-xs text-sky-800 dark:text-sky-300 font-medium">
                  {parsedResult.aiReply}
                </div>

                {/* Takeaway Badge */}
                {parsedResult.isTakeaway && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-xs font-extrabold w-fit">
                    <span className="material-symbols-outlined text-sm">takeout_dining</span>
                    <span>Đơn hàng mang về (Takeaway)</span>
                  </div>
                )}

                {/* Items List */}
                {parsedResult.items.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      <span>Món ăn bóc tách được ({parsedResult.items.length}):</span>
                      <span className="text-[10px] text-[#38BDF8] font-bold normal-case">Bấm vào món để xem chi tiết</span>
                    </div>
                    {parsedResult.items.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => onViewFoodDetail?.(item)}
                        role="button"
                        tabIndex={0}
                        title="Bấm để xem chi tiết món"
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-[#38BDF8] dark:hover:border-[#38BDF8] hover:bg-sky-50/40 dark:hover:bg-sky-950/25 transition-all cursor-pointer group active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] font-extrabold text-xs flex items-center justify-center shrink-0">
                            {item.quantity}x
                          </span>
                          <div>
                            <div className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-[#38BDF8] transition-colors">
                              {item.foodName}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                Size {item.size}
                              </span>
                              {item.ice && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                                  {item.ice}
                                </span>
                              )}
                              {item.sugar && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                  {item.sugar}
                                </span>
                              )}
                              {item.note && (
                                <span className="text-[11px] text-slate-400 italic">
                                  ({item.note})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                          </div>
                          <span className="text-[10px] font-bold text-[#38BDF8] opacity-80 group-hover:opacity-100 transition-opacity">
                            Xem chi tiết
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-500">
                    Chưa bóc tách được món nào. Bạn hãy thử nói lại rõ ràng hơn nhé.
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-3">
            <button
              onClick={startListening}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-extrabold transition-colors"
            >
              Nói lại
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-bold transition-colors"
              >
                Đóng
              </button>

              {parsedResult && parsedResult.items.length > 0 && (
                <button
                  onClick={handleConfirmAdd}
                  className="px-5 py-2.5 rounded-2xl bg-[#38BDF8] hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/20 transition-all active:scale-95"
                >
                  Thêm Vào Giỏ Hàng
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
