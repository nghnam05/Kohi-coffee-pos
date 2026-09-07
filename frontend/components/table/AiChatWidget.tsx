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

interface PromptCategory {
  categoryName: string;
  icon: string;
  items: string[];
}

const PROMPT_CATEGORIES: Record<'vi' | 'en' | 'zh', PromptCategory[]> = {
  vi: [
    {
      categoryName: 'Gu Đồ Uống',
      icon: 'local_cafe',
      items: ['Cà phê đậm vị', 'Trà trái cây thanh mát', 'Đồ uống ít ngọt', 'Không cafein'],
    },
    {
      categoryName: 'Bánh & Ăn Nhẹ',
      icon: 'bakery_dining',
      items: ['Bánh ngọt kèm cà phê', 'Đồ ăn nhẹ', 'Món bán chạy nhất'],
    },
    {
      categoryName: 'Tiện Ích Quán',
      icon: 'info',
      items: ['Mật khẩu Wi-Fi', 'Giờ mở cửa', 'Gọi phục vụ bàn'],
    },
  ],
  en: [
    {
      categoryName: 'Drink Preferences',
      icon: 'local_cafe',
      items: ['Rich Coffee', 'Refreshing Fruit Tea', 'Low Sugar Drink', 'Decaf Drinks'],
    },
    {
      categoryName: 'Bakery & Snacks',
      icon: 'bakery_dining',
      items: ['Pastry Pairings', 'Light Snacks', 'Best Sellers'],
    },
    {
      categoryName: 'Shop Info',
      icon: 'info',
      items: ['Wi-Fi Password', 'Opening Hours', 'Call Table Staff'],
    },
  ],
  zh: [
    {
      categoryName: '口味偏好',
      icon: 'local_cafe',
      items: ['浓郁咖啡', '清爽果茶', '低糖饮品', '无咖啡因'],
    },
    {
      categoryName: '烘焙点心',
      icon: 'bakery_dining',
      items: ['搭配咖啡甜点', '休闲轻食', '热销招牌'],
    },
    {
      categoryName: '店内信息',
      icon: 'info',
      items: ['Wi-Fi 密码', '营业时间', '呼叫服务员'],
    },
  ],
};

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
  const currentCategories = PROMPT_CATEGORIES[lang] || PROMPT_CATEGORIES.vi;

  const renderChatContent = () => (
    <>
      {/* Header */}
      <div className="px-4 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/25 shadow-2xs">
            <span className="material-symbols-outlined text-lg">smart_toy</span>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
              Kohi AI Assistant
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {lang === 'en'
                  ? 'Online • Ready to help'
                  : lang === 'zh'
                  ? '在线 • 随时为您服务'
                  : 'Trực tuyến • Tư vấn vị giác'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAiChatOpen(false)}
          className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center border border-slate-200 dark:border-white/10 transition-all active:scale-95 cursor-pointer shadow-2xs"
          title={lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      {/* Messages Body */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 scrollbar-none">
        {/* Zero-state: Welcome & Categorized Taste Chips */}
        {aiMessages.length === 0 && (
          <div className="py-2 space-y-4">
            <div className="text-center px-2 py-3 bg-gradient-to-b from-blue-500/5 to-transparent rounded-2xl border border-blue-500/10">
              <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 shadow-xs">
                <span className="material-symbols-outlined text-xl">auto_awesome</span>
              </div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                {lang === 'en'
                  ? 'Welcome to Kohi AI!'
                  : lang === 'zh'
                  ? '欢迎体验 Kohi AI 专属侍者！'
                  : 'Chào mừng bạn đến với Kohi AI!'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {lang === 'en'
                  ? 'Tell me your taste preference or choose a suggestion below:'
                  : lang === 'zh'
                  ? '请告诉我您的口味喜好，或直接点击下方快捷推荐：'
                  : 'Bạn thích gu vị nào hôm nay? Hãy chọn gợi ý nhanh bên dưới nhé:'}
              </p>
            </div>

            {/* Categorized Quick Suggestions */}
            <div className="space-y-3">
              {currentCategories.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    <span className="material-symbols-outlined text-xs">{group.icon}</span>
                    <span>{group.categoryName}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => handleSendAiMessage(chip)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 hover:bg-blue-500/10 hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 transition-all active:scale-95 cursor-pointer shadow-2xs"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Thread */}
        {aiMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1.5`}
          >
            <div
              className={`max-w-[88%] sm:max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-2xs font-sans ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white font-medium rounded-tr-xs'
                  : 'bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-tl-xs'
              }`}
            >
              {msg.text}
            </div>

            {/* Recommended Food Cards */}
            {msg.role === 'ai' && msg.recommendedFoods && msg.recommendedFoods.length > 0 && (
              <div className="w-full max-w-[95%] space-y-2 mt-1">
                <p className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">restaurant_menu</span>
                  {lang === 'en'
                    ? 'Recommended for you:'
                    : lang === 'zh'
                    ? '为您精选推荐：'
                    : 'Món gợi ý cho bạn:'}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {msg.recommendedFoods.map((food) => (
                    <div
                      key={food._id}
                      className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 hover:border-blue-500/40 transition-all shadow-xs"
                    >
                      <img
                        src={food.image}
                        alt={food.name}
                        className="w-14 h-14 object-cover rounded-xl shrink-0 border border-slate-200/80 dark:border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white truncate">
                          {food.name}
                        </h4>
                        <p className="text-xs font-black text-[#0284c7] dark:text-[#38BDF8] mt-0.5">
                          {food.price.toLocaleString('vi-VN')} đ
                        </p>
                      </div>
                      {onAddToCart && (
                        <button
                          type="button"
                          onClick={() => onAddToCart(food)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
                        >
                          <span className="material-symbols-outlined text-sm">
                            add_shopping_cart
                          </span>
                          <span>{lang === 'en' ? 'Add' : lang === 'zh' ? '加购' : 'Thêm'}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* AI Thinking Animation */}
        {isAiThinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 px-3.5 py-2.5 rounded-2xl rounded-tl-xs text-xs text-slate-500 dark:text-slate-400 shadow-xs">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
              </span>
              <span>
                {lang === 'en'
                  ? 'Kohi AI is thinking...'
                  : lang === 'zh'
                  ? 'Kohi AI 正在思考...'
                  : 'Kohi AI đang phân tích dữ liệu...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input Footer */}
      <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
          placeholder={
            lang === 'en'
              ? 'Ask Kohi AI anything...'
              : lang === 'zh'
              ? '输入关于口味或菜品的问题...'
              : 'Đặt câu hỏi hoặc nhập khẩu vị thích (VD: thích ngọt)...'
          }
          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
        />
        <button
          type="button"
          onClick={() => handleSendAiMessage()}
          disabled={!aiInput.trim() || isAiThinking}
          className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
          title={lang === 'en' ? 'Send' : lang === 'zh' ? '发送' : 'Gửi'}
        >
          <span className="material-symbols-outlined text-base">send</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── MOBILE: Bottom Sheet View (< 768px) ─────────────────────────── */}
      <AnimatePresence>
        {isAiChatOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center select-none font-sans">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAiChatOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            {/* Mobile Bottom Sheet Card */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="relative w-full bg-white dark:bg-[#0F172A] border-t border-slate-200 dark:border-white/10 rounded-t-[28px] shadow-2xl z-10 overflow-hidden flex flex-col h-[78vh] max-h-[640px]"
            >
              {/* Mobile Drag Indicator Handle */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 shrink-0 opacity-70" />

              {renderChatContent()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DESKTOP: Floating Card View (>= 768px) ──────────────────────── */}
      <AnimatePresence>
        {isAiChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="hidden md:flex fixed right-6 bottom-24 z-40 w-[420px] h-[580px] bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex-col font-sans"
          >
            {renderChatContent()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING ACTION BUTTON (FAB) ─────────────────────────────────── */}
      {/* Auto-hidden on desktop (lg) since LeftSidebar already has the full Kohi AI Box */}
      <button
        type="button"
        onClick={() => setIsAiChatOpen(!isAiChatOpen)}
        className={`lg:hidden fixed right-4 bottom-5 md:right-6 md:bottom-6 z-30 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-xl shadow-blue-500/30 items-center justify-center transition-all duration-200 active:scale-90 border-2 border-white/25 cursor-pointer backdrop-blur-md ${
          isAiChatOpen ? 'hidden md:flex' : 'flex'
        }`}
        title="Kohi AI Assistant"
      >
        <span
          className="material-symbols-outlined text-[30px] leading-none select-none"
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 48" }}
        >
          {isAiChatOpen ? 'close' : 'smart_toy'}
        </span>
      </button>
    </>
  );
};
