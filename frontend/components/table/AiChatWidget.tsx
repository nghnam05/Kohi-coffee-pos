'use client';
import { AppIcon } from '@/components/common/DashboardIcon';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { ChatBubble } from '@/components/ui/ChatBubble';

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
  isHidden?: boolean;
}

interface PromptCategory {
  categoryName: string;
  icon: string;
  items: string[];
}

const PROMPT_CATEGORIES: Record<'vi' | 'en' | 'zh', PromptCategory[]> = {
  vi: [
    {
      categoryName: 'Món Bán Chạy & Giá Cả',
      icon: 'local_fire_department',
      items: [
        'Cà phê kem muối giá bao nhiêu?',
        'Các món cà phê dưới 30k',
        'Món bán chạy nhất của quán',
      ],
    },
    {
      categoryName: 'Thành Phần & Khẩu Vị',
      icon: 'local_cafe',
      items: [
        'Sinh tố dâu cheesecake có béo không?',
        'Đồ uống thanh mát không cafein',
        'Đồ uống ít ngọt, chua thanh',
      ],
    },
    {
      categoryName: 'Combo Bánh & Nước',
      icon: 'bakery_dining',
      items: [
        'Uống cà phê nên ăn kèm bánh gì?',
        'Combo bánh và nước tầm 60k - 70k',
      ],
    },
    {
      categoryName: 'Tiện Ích Quán',
      icon: 'info',
      items: ['Mật khẩu Wi-Fi là gì?', 'Giờ mở cửa của quán'],
    },
  ],
  en: [
    {
      categoryName: 'Best Sellers & Prices',
      icon: 'local_fire_department',
      items: [
        'How much is Salted Cream Coffee?',
        'Coffee options under 30k',
        'What are your best sellers?',
      ],
    },
    {
      categoryName: 'Ingredients & Taste',
      icon: 'local_cafe',
      items: [
        'Is Strawberry Cheesecake Smoothie rich?',
        'Refreshing caffeine-free drinks',
        'Low sugar & sour-sweet drinks',
      ],
    },
    {
      categoryName: 'Coffee & Pastry Combos',
      icon: 'bakery_dining',
      items: [
        'Best pastry to pair with coffee?',
        'Drink & cake combo under 70k',
      ],
    },
    {
      categoryName: 'Shop Info',
      icon: 'info',
      items: ['What is the Wi-Fi password?', 'Opening hours'],
    },
  ],
  zh: [
    {
      categoryName: '热销与价格',
      icon: 'local_fire_department',
      items: [
        '海盐奶盖咖啡多少钱？',
        '3万越南盾以下的咖啡',
        '店内最畅销的招牌是什么？',
      ],
    },
    {
      categoryName: '成分与口味',
      icon: 'local_cafe',
      items: [
        '草莓芝士冰沙口感偏甜腻吗？',
        '无咖啡因的清爽解渴饮品',
        '微甜偏酸爽的饮品推荐',
      ],
    },
    {
      categoryName: '饮品甜点套餐',
      icon: 'bakery_dining',
      items: [
        '喝咖啡配什么点心最合适？',
        '6万至7万越南盾的蛋糕饮品组合',
      ],
    },
    {
      categoryName: '店内信息',
      icon: 'info',
      items: ['店内 Wi-Fi 密码是多少？', '营业时间'],
    },
  ],
};

const QUICK_FOLLOWUP_PROMPTS: Record<'vi' | 'en' | 'zh', Array<{ text: string; icon: string }>> = {
  vi: [
    { text: 'Món bán chạy nhất', icon: 'local_fire_department' },
    { text: 'Các món dưới 30k', icon: 'payments' },
    { text: 'Uống gì giải nhiệt?', icon: 'eco' },
    { text: 'Mật khẩu Wi-Fi', icon: 'wifi' },
  ],
  en: [
    { text: 'Best seller drinks', icon: 'local_fire_department' },
    { text: 'Drinks under 30k', icon: 'payments' },
    { text: 'Refreshing choices', icon: 'eco' },
    { text: 'Wi-Fi password', icon: 'wifi' },
  ],
  zh: [
    { text: '店内招牌推荐', icon: 'local_fire_department' },
    { text: '3万盾以下饮品', icon: 'payments' },
    { text: '清爽解暑饮品', icon: 'eco' },
    { text: 'Wi-Fi 密码', icon: 'wifi' },
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
  isHidden = false,
}) => {
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const currentCategories = PROMPT_CATEGORIES[lang] || PROMPT_CATEGORIES.vi;
  const currentQuickPrompts = QUICK_FOLLOWUP_PROMPTS[lang] || QUICK_FOLLOWUP_PROMPTS.vi;

  // Auto-scroll to latest message
  useEffect(() => {
    if (isAiChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, isAiThinking, isAiChatOpen]);

  const toggleSpeechInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt chưa hỗ trợ nhận diện giọng nói. Vui lòng sử dụng Chrome, Edge hoặc Safari.');
      return;
    }
    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.lang = lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : 'vi-VN';
      rec.continuous = false;
      rec.interimResults = false;
      rec.onstart = () => setIsListeningVoice(true);
      rec.onresult = (e: any) => {
        const text = e.results?.[0]?.[0]?.transcript?.trim();
        if (text) {
          setAiInput(text);
          handleSendAiMessage(text);
        }
      };
      rec.onerror = () => setIsListeningVoice(false);
      rec.onend = () => setIsListeningVoice(false);
      rec.start();
    } catch (e) {
      console.error('Lỗi nhận diện micro trong chat:', e);
      setIsListeningVoice(false);
    }
  };

  const renderChatContent = () => (
    <>
      {/* ── Drag Header Bar (Moves the entire chat window across the screen) ── */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="px-3.5 py-2.5 bg-slate-50/95 dark:bg-[#0B0F17]/95 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing touch-none select-none backdrop-blur-md transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center text-slate-400 dark:text-slate-500 hover:text-sky-500 transition-colors" title="Nhấn giữ và kéo để di chuyển">
            <AppIcon name="drag_indicator" className="text-base" />
          </div>
          <div className="relative w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 dark:from-[#0F172A] dark:to-[#1E293B] text-white dark:text-[#38BDF8] flex items-center justify-center border border-sky-400/40 dark:border-[#38BDF8]/40 shadow-xs shrink-0">
            <AppIcon name="auto_awesome" className="text-[14px] animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-white dark:ring-[#090D16] animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black text-slate-900 dark:text-white leading-tight font-sans truncate">
                Kohi AI
              </h3>
              <span className="text-[8.5px] font-black uppercase px-1 py-0.2 rounded bg-sky-500/15 text-[#0284c7] dark:text-[#38BDF8] border border-sky-500/25 shrink-0 font-mono">
                v2.5
              </span>
            </div>
            <p className="text-[9.5px] font-medium text-slate-500 dark:text-slate-400 truncate leading-tight font-sans">
              {lang === 'en'
                ? 'Taste guide • Drag anywhere'
                : lang === 'zh'
                ? '智能口味向导 • 可任意拖动'
                : 'Trợ lý vị giác • Kéo để di chuyển'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsAiChatOpen(false)}
            className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center border border-slate-200/80 dark:border-white/10 transition-all active:scale-90 cursor-pointer shadow-2xs"
            title={lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
            aria-label="Đóng trợ lý AI"
          >
            <AppIcon name="close" className="text-sm" />
          </button>
        </div>
      </div>

      {/* ── Messages Body (Scrolls smoothly inside the compact chat) ────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none overscroll-contain select-text font-sans bg-white/50 dark:bg-transparent">
        {/* Zero-state: Compact Welcome & Categorized Prompt Chips */}
        {aiMessages.length === 0 && (
          <div className="py-0.5 space-y-2.5">
            {/* Ambient Hero Mini-Card with adaptive Light/Dark styling */}
            <div className="rounded-2xl p-2.5 bg-gradient-to-br from-sky-50 via-white to-blue-50/40 dark:from-sky-500/10 dark:via-[#111827]/70 dark:to-blue-500/10 border border-sky-200/80 dark:border-sky-400/20 text-center shadow-xs">
              <div className="w-8 h-8 mx-auto rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center mb-1 shadow-xs">
                <AppIcon name="auto_awesome" className="text-base" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white font-sans">
                {lang === 'en'
                  ? 'Kohi AI Assistant'
                  : lang === 'zh'
                  ? 'Kohi AI 智能助手'
                  : 'Trợ lý Kohi AI'}
              </h4>
              <p className="text-[10.5px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed font-sans">
                {lang === 'en'
                  ? 'Ask for taste recommendations, pastry combos, or shop info:'
                  : lang === 'zh'
                  ? '咨询推荐口味、点心搭配、价格或 Wi-Fi：'
                  : 'Hỏi về khẩu vị, giá cả, combo bánh nước hoặc Wi-Fi:'}
              </p>
            </div>

            {/* Categorized Quick Suggestions */}
            <div className="space-y-2">
              {currentCategories.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 font-sans">
                    <AppIcon name={group.icon} className="text-[11px] text-[#0284c7] dark:text-[#38BDF8]" />
                    <span>{group.categoryName}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {group.items.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => handleSendAiMessage(chip)}
                        className="text-left text-[11px] font-medium px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#131926] hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-300 dark:hover:border-sky-400/50 text-slate-800 dark:text-slate-200 hover:text-sky-600 dark:hover:text-[#38BDF8] border border-slate-200/90 dark:border-white/10 transition-all active:scale-98 cursor-pointer shadow-2xs flex items-center justify-between gap-1.5 group font-sans"
                      >
                        <span className="truncate">{chip}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-sky-500 dark:group-hover:text-[#38BDF8] transition-colors shrink-0">
                          →
                        </span>
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
          <div key={i} className="flex flex-col gap-1.5">
            <ChatBubble
              sender={msg.role === 'user' ? 'user' : 'assistant'}
              avatar={
                msg.role === 'ai' ? (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 dark:from-[#090D16] dark:to-[#1E293B] text-white dark:text-[#38BDF8] flex items-center justify-center border border-sky-400/40 dark:border-[#38BDF8]/30 shadow-2xs shrink-0">
                    <AppIcon name="auto_awesome" className="text-xs" />
                  </div>
                ) : undefined
              }
            >
              <div className="text-xs whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </div>
            </ChatBubble>

            {/* Recommended Food Cards */}
            {msg.role === 'ai' && msg.recommendedFoods && msg.recommendedFoods.length > 0 && (
              <div className="w-full max-w-[96%] space-y-1.5 mt-0.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#0284c7] dark:text-[#38BDF8] flex items-center gap-1 px-0.5">
                  <AppIcon name="menu_book" className="text-xs" />
                  <span>
                    {lang === 'en'
                      ? 'Recommended:'
                      : lang === 'zh'
                      ? '推荐菜品：'
                      : 'Món gợi ý phù hợp:'}
                  </span>
                </p>
                <div className="flex flex-col gap-1.5">
                  {msg.recommendedFoods.map((food) => (
                    <div
                      key={food._id}
                      className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50/90 dark:bg-[#131926] shadow-2xs hover:border-sky-300 dark:hover:border-[#38BDF8]/50 transition-all"
                    >
                      <img
                        src={food.image}
                        alt={food.name}
                        className="w-12 h-12 object-cover rounded-lg shrink-0 border border-slate-200/80 dark:border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate font-sans">
                          {food.name}
                        </h4>
                        <p className="text-[11px] font-black text-[#0284c7] dark:text-[#38BDF8] mt-0.5 font-mono">
                          {food.price.toLocaleString('vi-VN')} đ
                        </p>
                      </div>
                      {onAddToCart && (
                        <button
                          type="button"
                          onClick={() => onAddToCart(food)}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-xs shadow-sky-500/25 cursor-pointer shrink-0 font-sans"
                        >
                          <AppIcon name="add_shopping_cart" className="text-xs" />
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
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 dark:bg-[#131926] dark:border-white/10 px-3 py-2 rounded-xl rounded-tl-xs text-[11px] text-slate-600 dark:text-slate-400 shadow-xs">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-bounce" />
              </span>
              <span className="font-medium font-sans">
                {lang === 'en'
                  ? 'Kohi AI is thinking...'
                  : lang === 'zh'
                  ? 'Kohi AI 正在思考...'
                  : 'Kohi AI đang phân tích dữ liệu...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Compact Input Dock with Follow-up Carousel ──────────────── */}
      <div className="p-2.5 border-t border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#090D16]/95 flex flex-col gap-1.5 shrink-0 backdrop-blur-xl transition-colors">
        {/* Quick follow-up chip pills during active conversation */}
        {aiMessages.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none touch-pan-x">
            {currentQuickPrompts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendAiMessage(item.text)}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 border border-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-sky-950/40 dark:hover:text-[#38BDF8] dark:border-white/10 transition-all shrink-0 active:scale-95 flex items-center gap-0.5 cursor-pointer font-sans"
              >
                <AppIcon name={item.icon} className="text-[11px] text-sky-500" />
                <span>{item.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input Bar Row */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
            placeholder={
              lang === 'en'
                ? 'Ask Kohi AI...'
                : lang === 'zh'
                ? '输入关于口味或菜品的问题...'
                : 'Hỏi Kohi AI (vị, combo, wifi)...'
            }
            className="flex-1 bg-slate-100 dark:bg-[#131926] border border-slate-200/90 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] transition-all font-sans"
          />
          <button
            type="button"
            onClick={toggleSpeechInput}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer shrink-0 ${
              isListeningVoice
                ? 'bg-[#38BDF8] text-[#090D16] shadow-sky-500/40 animate-pulse'
                : 'bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-600 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-sky-500/20 dark:hover:text-[#38BDF8]'
            }`}
            title={isListeningVoice ? 'Đang lắng nghe... Bấm để dừng' : 'Nói để đặt câu hỏi'}
            aria-label="Nói để đặt câu hỏi"
          >
            <AppIcon name={isListeningVoice ? 'graphic_eq' : 'mic'} className="text-[15px]" />
          </button>
          <button
            type="button"
            onClick={() => handleSendAiMessage()}
            disabled={!aiInput.trim() || isAiThinking}
            className="w-8 h-8 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs shadow-sky-500/25 cursor-pointer shrink-0"
            title={lang === 'en' ? 'Send' : lang === 'zh' ? '发送' : 'Gửi'}
            aria-label="Gửi tin nhắn"
          >
            <AppIcon name="send" className="text-[15px]" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── FULLSCREEN BOUNDARY CONTAINER FOR FREE DRAGGING ─────────── */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      >
        {/* ── DRAGGABLE MODERN CHAT MODAL ("Đoạn chat nhỏ hiện đại") ──── */}
        <AnimatePresence>
          {isAiChatOpen && (
            <motion.div
              drag
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={constraintsRef}
              dragElastic={0.08}
              dragMomentum={false}
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="fixed bottom-[80px] right-3 sm:right-6 pointer-events-auto z-50 w-[calc(100vw-24px)] max-w-[340px] sm:max-w-[360px] h-[480px] max-h-[72vh] flex flex-col bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-sky-400/25 rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden font-sans transition-colors"
            >
              {renderChatContent()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DRAGGABLE FLOATING ACTION PILL (< 768px & DESKTOP) ─────── */}
        <AnimatePresence>
          {!isAiChatOpen && !isHidden && (
            <motion.div
              drag
              dragConstraints={constraintsRef}
              dragElastic={0.12}
              dragMomentum={false}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileTap={{ scale: 0.94 }}
              className="fixed bottom-[80px] right-3.5 pointer-events-auto z-50 cursor-grab active:cursor-grabbing touch-none select-none"
            >
              <button
                type="button"
                onClick={() => setIsAiChatOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white/95 dark:bg-[#090D16]/95 border border-slate-200/90 dark:border-[#38BDF8]/60 text-slate-800 dark:text-white shadow-[0_8px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_25px_rgba(56,189,248,0.28)] backdrop-blur-md cursor-pointer font-sans active:scale-95 transition-all hover:border-sky-400/60"
                aria-label="Mở trợ lý ảo Kohi AI"
              >
                <div className="w-6 h-6 rounded-full bg-sky-500/15 dark:bg-[#38BDF8]/20 text-[#0284c7] dark:text-[#38BDF8] flex items-center justify-center">
                  <AppIcon name="auto_awesome" className="text-sm animate-pulse" />
                </div>
                <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
                  <span>Kohi AI</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </span>
                <AppIcon name="drag_indicator" className="text-xs text-slate-400 dark:text-slate-500 ml-0.5 opacity-70" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
