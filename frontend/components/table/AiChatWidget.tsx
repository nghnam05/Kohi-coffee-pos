'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AiMessage {
  role: 'user' | 'ai';
  text: string;
  recommendedFoods?: Array<{
    _id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    description?: string;
  }>;
}

interface AiChatWidgetProps {
  totalQuantity: number;
  isAiChatOpen: boolean;
  setIsAiChatOpen: (open: boolean) => void;
  aiMessages: AiMessage[];
  isAiThinking: boolean;
  aiInput: string;
  setAiInput: (val: string) => void;
  handleSendAiMessage: (overrideText?: string) => void;
  onAddToCart?: (food: any) => void;
  lang?: 'vi' | 'en' | 'zh';
}

const TASTE_PRESET_CHIPS = [
  'Thích vị ngọt',
  'Thèm bánh ngọt Pastry',
  'Cà phê đắng nhẹ',
  'Giải nhiệt không cafein',
  'Vị béo ngậy',
  'Mật khẩu Wifi',
  'Giờ mở cửa',
];

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({
  totalQuantity,
  isAiChatOpen,
  setIsAiChatOpen,
  aiMessages,
  isAiThinking,
  aiInput,
  setAiInput,
  handleSendAiMessage,
  onAddToCart,
  lang = 'vi',
}) => {
  return (
    <motion.div
      drag
      dragConstraints={{ left: -10, right: 320, top: -650, bottom: 10 }}
      dragElastic={0.1}
      dragMomentum={false}
      whileDrag={{ scale: 1.12 }}
      className="fixed left-4 md:left-auto md:right-6 lg:right-[380px] z-30 flex flex-col items-start md:items-end gap-3 bottom-5 md:bottom-6 touch-none cursor-grab active:cursor-grabbing"
    >
      <AnimatePresence>
        {isAiChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[calc(100vw-32px)] max-w-sm sm:w-[420px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden flex flex-col h-[500px]"
          >
            {/* Header */}
            <div className="bg-[var(--bg-primary)] px-4 py-3 flex items-center justify-between border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--brand-primary)] text-lg">
                  smart_toy
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)] font-sans">
                  Kohi AI Assistant
                </span>
              </div>
              <button
                onClick={() => setIsAiChatOpen(false)}
                className="w-7 h-7 rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center border border-[var(--border-color)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
              {aiMessages.length === 0 && (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">
                      auto_awesome
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-medium font-sans">
                    {lang === 'en'
                      ? 'Welcome! How can Kohi AI assist you today?'
                      : lang === 'zh'
                      ? '您好！今天 Kohi AI 能为您推荐什么？'
                      : 'Xin chào! Bạn cần Kohi AI gợi ý món ăn hay giải đáp câu hỏi nào hôm nay?'}
                  </p>
                </div>
              )}

              {/* Quick Taste Chips */}
              <div className="flex flex-wrap gap-1.5 pb-2">
                {TASTE_PRESET_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendAiMessage(chip)}
                    className="text-[11px] font-sans px-2.5 py-1 rounded-full bg-[var(--bg-primary)] hover:bg-[var(--brand-primary)] hover:text-white border border-[var(--border-color)] text-[var(--text-secondary)] transition-all cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {aiMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}
                >
                  <div
                    className={`max-w-[90%] px-3.5 py-2.5 rounded-[var(--radius-md)] text-[13px] leading-relaxed font-sans ${
                      msg.role === 'user'
                        ? 'bg-[var(--brand-primary)] text-white font-medium shadow-sm'
                        : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Render Recommended Food Cards if available */}
                  {msg.role === 'ai' && msg.recommendedFoods && msg.recommendedFoods.length > 0 && (
                    <div className="w-full space-y-2 mt-1">
                      <p className="text-[11px] font-semibold text-[var(--text-secondary)] font-sans">
                        Gợi ý món ăn dành cho bạn:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {msg.recommendedFoods.map((food) => (
                          <div
                            key={food._id}
                            className="flex items-center gap-3 p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--brand-primary)]/50 transition-all shadow-sm"
                          >
                            <img
                              src={food.image}
                              alt={food.name}
                              className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[12.5px] font-bold text-[var(--text-primary)] truncate font-sans">
                                {food.name}
                              </h4>
                              <p className="text-[11.5px] font-semibold text-[var(--brand-primary)] font-sans">
                                {food.price.toLocaleString('vi-VN')} VNĐ
                              </p>
                            </div>
                            {onAddToCart && (
                              <button
                                onClick={() => onAddToCart(food)}
                                className="px-2.5 py-1.5 rounded-md bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer flex-shrink-0"
                              >
                                <span className="material-symbols-outlined text-[13px]">
                                  add_shopping_cart
                                </span>
                                Thêm vào giỏ
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isAiThinking && (
                <div className="flex justify-start">
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-[12px] p-2.5 rounded-[var(--radius-md)] animate-pulse font-sans">
                    {lang === 'en' ? 'Kohi AI is thinking...' : lang === 'zh' ? 'Kohi AI 正在思考...' : 'Kohi AI đang phân tích dữ liệu món...'}
                  </div>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-primary)] flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                placeholder={
                  lang === 'en'
                    ? 'Ask Kohi AI anything...'
                    : lang === 'zh'
                    ? '向 Kohi AI 提问...'
                    : 'Đặt câu hỏi hoặc nhập khẩu vị thích (VD: thích ngọt)...'
                }
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-sm)] px-3 py-2 text-[12.5px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--brand-primary)] font-sans"
              />
              <button
                onClick={() => handleSendAiMessage()}
                disabled={!aiInput.trim() || isAiThinking}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-3.5 py-2 rounded-[var(--radius-sm)] text-[12.5px] font-semibold transition-all active:scale-95 disabled:opacity-50 font-sans cursor-pointer"
              >
                {lang === 'en' ? 'Send' : lang === 'zh' ? '发送' : 'Gửi'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsAiChatOpen(!isAiChatOpen)}
        className="w-14 h-14 rounded-full bg-[#3AA6FF]/90 hover:bg-[#3AA6FF] text-white shadow-2xl shadow-[#3AA6FF]/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/20 cursor-pointer backdrop-blur-md opacity-70 hover:opacity-100 active:opacity-100"
        title="Kohi AI Assistant"
      >
        <span
          className="material-symbols-outlined text-[34px] leading-none select-none"
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 48" }}
        >
          {isAiChatOpen ? 'close' : 'smart_toy'}
        </span>
      </button>
    </motion.div>
  );
};
