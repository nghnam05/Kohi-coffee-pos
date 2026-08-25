'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AiMessage {
  role: 'user' | 'ai';
  text: string;
}

interface AiChatWidgetProps {
  totalQuantity: number;
  isAiChatOpen: boolean;
  setIsAiChatOpen: (open: boolean) => void;
  aiMessages: AiMessage[];
  isAiThinking: boolean;
  aiInput: string;
  setAiInput: (val: string) => void;
  handleSendAiMessage: () => void;
  lang?: 'vi' | 'en' | 'zh';
}

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({
  totalQuantity,
  isAiChatOpen,
  setIsAiChatOpen,
  aiMessages,
  isAiThinking,
  aiInput,
  setAiInput,
  handleSendAiMessage,
  lang = 'vi',
}) => {
  return (
    <div
      className={`fixed right-4 lg:right-[380px] z-30 flex flex-col items-end gap-3 md:bottom-6 transition-all duration-300 ${
        totalQuantity > 0 ? 'bottom-[88px] md:bottom-6' : 'bottom-6'
      }`}
    >
      <AnimatePresence>
        {isAiChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-80 sm:w-96 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden flex flex-col h-[400px]"
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
                className="w-7 h-7 rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center border border-[var(--border-color)]"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
              {aiMessages.length === 0 && (
                <div className="text-center py-10 space-y-2">
                  <span className="material-symbols-outlined text-3xl text-[var(--brand-primary)]">
                    auto_awesome
                  </span>
                  <p className="text-xs text-[var(--text-secondary)] font-medium font-sans">
                    {lang === 'en'
                      ? 'Hello! How can Kohi AI assist you today?'
                      : lang === 'zh'
                      ? '您好！今天 Kohi AI 能为您推荐什么？'
                      : 'Xin chào! Bạn cần Kohi AI tư vấn món ăn nào hôm nay?'}
                  </p>
                </div>
              )}
              {aiMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-[var(--radius-md)] text-[13px] leading-relaxed font-sans ${
                      msg.role === 'user'
                        ? 'bg-[var(--brand-primary)] text-white font-medium shadow-sm'
                        : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiThinking && (
                <div className="flex justify-start">
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-[12px] p-2.5 rounded-[var(--radius-md)] animate-pulse font-sans">
                    {lang === 'en' ? 'Kohi AI is thinking...' : lang === 'zh' ? 'Kohi AI 正在思考...' : 'Kohi AI đang suy nghĩ...'}
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
                placeholder={lang === 'en' ? 'Ask Kohi AI anything...' : lang === 'zh' ? '向 Kohi AI 提问...' : 'Đặt câu hỏi cho Kohi AI...'}
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-sm)] px-3 py-2 text-[12.5px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--brand-primary)] font-sans"
              />
              <button
                onClick={handleSendAiMessage}
                disabled={!aiInput.trim() || isAiThinking}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-3.5 py-2 rounded-[var(--radius-sm)] text-[12.5px] font-semibold transition-all active:scale-95 disabled:opacity-50 font-sans cursor-pointer"
              >
                {lang === 'en' ? 'Send' : lang === 'zh' ? '发送' : 'Gửi'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsAiChatOpen(!isAiChatOpen)}
        className="w-12 h-12 rounded-full bg-[#3AA6FF] hover:bg-[#2B96EF] text-white shadow-2xl shadow-[#3AA6FF]/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20 cursor-pointer"
        title={isAiChatOpen ? 'Kohi AI' : 'Kohi AI'}
      >
        <span className="material-symbols-outlined text-2xl">
          {isAiChatOpen ? 'close' : 'smart_toy'}
        </span>
      </button>
    </div>
  );
};
