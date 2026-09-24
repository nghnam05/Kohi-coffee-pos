'use client';
import { AppIcon } from '@/components/common/DashboardIcon';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1')
  .trim()
  .replace(/[\r\n\t]+/g, '')
  .replace(/\/+$/, '');

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
        />

        {/* Main Card / Centered Pop-up Modal */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 12 }}
          transition={{ type: 'spring', damping: 26, stiffness: 350 }}
          className="relative z-10 w-full max-w-lg bg-white dark:bg-[#090D16] text-slate-900 dark:text-white border border-slate-200/90 dark:border-white/10 rounded-3xl shadow-2xl dark:shadow-[0_10px_50px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col h-auto max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-[#0284c7] dark:text-[#38BDF8] flex items-center justify-center border border-sky-500/20 dark:border-[#38BDF8]/30 shrink-0">
                <AppIcon name="auto_awesome" className="text-lg" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                    Gọi Món Giọng Nói
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#0284c7]/10 dark:bg-[#38BDF8]/15 text-[#0284c7] dark:text-[#38BDF8] border border-[#0284c7]/20 dark:border-[#38BDF8]/30 tracking-wider">
                    KOHI AI
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">
                  Nói tự nhiên, AI tự động thêm vào giỏ hàng
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
              title="Đóng"
            >
              <AppIcon name="close" className="text-base" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center scrollbar-thin">
            {/* Pulsing Voice Orb Button */}
            <div className="relative my-3 sm:my-5 flex flex-col items-center">
              {isListening && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full bg-[#0284c7]/20 dark:bg-[#38BDF8]/20 -m-3 pointer-events-none"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.22, 1], opacity: [0.6, 0.1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full bg-[#0284c7]/30 dark:bg-[#38BDF8]/30 -m-1.5 pointer-events-none"
                  />
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  if (isListening) {
                    stopListeningAndParse();
                  } else {
                    startListening();
                  }
                }}
                disabled={isParsing}
                className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer select-none ${
                  isListening
                    ? 'bg-[#0284c7] dark:bg-[#38BDF8] text-white dark:text-slate-950 shadow-[0_0_35px_rgba(2,132,199,0.45)] dark:shadow-[0_0_35px_rgba(56,189,248,0.5)] scale-105'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white border-2 border-sky-400/60 dark:border-[#38BDF8]/40 hover:border-[#0284c7] dark:hover:border-[#38BDF8] shadow-[0_0_20px_rgba(2,132,199,0.12)] dark:shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:shadow-[0_0_25px_rgba(2,132,199,0.25)]'
                }`}
              >
                {isListening ? (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <AppIcon name="graphic_eq" className="text-2xl text-white dark:text-slate-950" />
                    <span className="text-[10px] font-extrabold tracking-wider uppercase text-white dark:text-slate-950">
                      DỪNG
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <AppIcon name="mic" className="text-2xl sm:text-3xl text-[#0284c7] dark:text-[#38BDF8]" />
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight mt-0.5">
                      CHẠM ĐỂ NÓI
                    </span>
                  </div>
                )}
              </button>
            </div>

            {/* Status Label & Audio Waveform */}
            <div className="text-center mb-3 sm:mb-4 w-full">
              {isParsing ? (
                <div className="flex items-center justify-center gap-2 py-1 text-xs sm:text-sm font-extrabold text-[#0284c7] dark:text-[#38BDF8]">
                  <AppIcon name="progress_activity" className="text-lg animate-spin" />
                  <span>Kohi AI đang bóc tách món ăn...</span>
                </div>
              ) : isListening ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1 h-5 sm:h-6 mb-0.5">
                    {[10, 18, 14, 22, 16, 20, 12].map((h, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: ['6px', `${h}px`, '6px'] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.5 + (i % 3) * 0.12,
                          ease: 'easeInOut',
                        }}
                        className="w-1 bg-[#0284c7] dark:bg-[#38BDF8] rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#0284c7] dark:text-[#38BDF8]">
                    Đang lắng nghe bạn nói...
                  </span>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                    Ví dụ: &ldquo;Cho 2 ly Matcha dâu size L ít đá và 1 bánh tart trứng mang về&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => stopListeningAndParse()}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#0284c7] hover:bg-sky-600 dark:bg-[#38BDF8] dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <AppIcon name="stop_circle" className="text-base" />
                    <span>Nói Xong (Dừng & Phân tích)</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 tracking-wide">
                    Chạm vào Micro để bắt đầu
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                    AI sẽ tự nhận diện tên món
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="w-full p-3 mb-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            {/* Realtime Live Transcript Box */}
            {transcript && (
              <div className="w-full p-3.5 mb-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#0284c7] dark:text-[#38BDF8] mb-1.5">
                  <span>Giọng nói nhận diện</span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 lowercase font-normal">tự động gửi sau 2.5s</span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white italic leading-relaxed">
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
                <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/50 text-xs text-sky-900 dark:text-sky-200 font-medium leading-relaxed">
                  <span className="font-extrabold text-[#0284c7] dark:text-[#38BDF8] block mb-0.5 uppercase tracking-wider text-[10px]">
                    Kohi AI:
                  </span>
                  {parsedResult.aiReply}
                </div>

                {/* Takeaway Badge */}
                {parsedResult.isTakeaway && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold tracking-wider">
                    <AppIcon name="takeout_dining" className="text-sm" />
                    <span>ĐƠN HÀNG MANG VỀ</span>
                  </div>
                )}

                {/* Items List */}
                {parsedResult.items.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <span>Món bóc tách ({parsedResult.items.length})</span>
                      <span className="text-[10px] text-[#0284c7] dark:text-[#38BDF8] font-bold normal-case">Chạm món để xem chi tiết</span>
                    </div>
                    {parsedResult.items.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => onViewFoodDetail?.(item)}
                        role="button"
                        tabIndex={0}
                        title="Bấm để xem chi tiết món"
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 hover:border-[#0284c7] dark:hover:border-[#38BDF8] hover:bg-white dark:hover:bg-slate-800/90 transition-all cursor-pointer group active:scale-[0.99] gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="w-8 h-8 rounded-xl bg-[#0284c7]/10 dark:bg-[#38BDF8]/15 text-[#0284c7] dark:text-[#38BDF8] font-extrabold text-xs flex items-center justify-center shrink-0 border border-[#0284c7]/20 dark:border-[#38BDF8]/20">
                            {item.quantity}x
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-[#0284c7] dark:group-hover:text-[#38BDF8] transition-colors truncate">
                              {item.foodName}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700">
                                Size {item.size}
                              </span>
                              {item.ice && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
                                  {item.ice}
                                </span>
                              )}
                              {item.sugar && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                  {item.sugar}
                                </span>
                              )}
                              {item.note && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 italic truncate max-w-[130px]">
                                  ({item.note})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-1.5">
                          <div>
                            <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                              {(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                            </div>
                            <span className="text-[10px] font-extrabold text-[#0284c7] dark:text-[#38BDF8] opacity-80 group-hover:opacity-100 transition-opacity">
                              Xem chi tiết
                            </span>
                          </div>
                          <AppIcon name="chevron_right" className="text-slate-400 group-hover:text-[#0284c7] dark:group-hover:text-[#38BDF8] text-sm transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-500 dark:text-slate-400">
                    Chưa bóc tách được món nào. Bạn hãy thử nói lại rõ ràng hơn nhé.
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-5 sm:px-6 py-3.5 sm:py-4 pb-5 sm:pb-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#090D16] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={startListening}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#0284c7] dark:hover:text-white hover:border-[#0284c7] dark:hover:border-[#38BDF8] hover:bg-white dark:hover:bg-slate-800/60 text-xs font-extrabold transition-all shrink-0 active:scale-95 shadow-2xs"
            >
              <AppIcon name="replay" className="text-base" />
              <span>Nói Lại</span>
            </button>

            <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
              {isListening && (
                <button
                  type="button"
                  onClick={() => stopListeningAndParse()}
                  disabled={isParsing}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0284c7] hover:bg-sky-600 dark:bg-[#38BDF8] dark:hover:bg-sky-400 text-white dark:text-slate-950 font-extrabold text-xs shadow-md transition-all active:scale-95 shrink-0"
                >
                  <AppIcon name="stop_circle" className="text-base" />
                  <span>Nói Xong</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition-colors shrink-0 active:scale-95"
              >
                Đóng
              </button>

              {parsedResult && parsedResult.items.length > 0 && (
                <button
                  type="button"
                  onClick={handleConfirmAdd}
                  className="flex items-center justify-center gap-1.5 flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-sky-600 dark:bg-[#38BDF8] dark:hover:bg-sky-400 text-white dark:text-slate-950 font-extrabold text-xs shadow-md transition-all active:scale-95 text-center truncate"
                >
                  <AppIcon name="shopping_bag" className="text-base" />
                  <span>Thêm Vào Giỏ Hàng</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
