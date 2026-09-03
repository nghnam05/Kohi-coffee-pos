'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface Food {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
}

interface Review {
  foodRating?: {
    comment?: string;
  };
}

interface AiMessage {
  role: 'user' | 'ai';
  text: string;
}

interface FoodDetailModalProps {
  selectedFood: Food | null;
  setSelectedFood: (food: Food | null) => void;
  isLightboxOpen: boolean;
  setIsLightboxOpen: (open: boolean) => void;
  selectedSize: 'S' | 'M' | 'L';
  setSelectedSize: (sz: 'S' | 'M' | 'L') => void;
  selectedAddons: string[];
  setSelectedAddons: React.Dispatch<React.SetStateAction<string[]>>;
  modalQuantity: number;
  setModalQuantity: React.Dispatch<React.SetStateAction<number>>;
  modalNote: string;
  setModalNote: (note: string) => void;
  handleAddFromModal: () => void;
  foodReviews: Review[];
  isLoadingReviews: boolean;
  fetchFoodReviews: (foodId: string) => void;
  isModalAiOpen: boolean;
  setIsModalAiOpen: (open: boolean) => void;
  modalAiMessages: AiMessage[];
  modalAiInput: string;
  setModalAiInput: (val: string) => void;
  isModalAiThinking: boolean;
  handleSendModalAiMessage: (prompt?: string) => void;
  SIZE_MULTIPLIERS: Record<'S' | 'M' | 'L', number>;
  ADDON_PRICES: Record<string, number>;
  ADDON_ICONS: Record<string, string>;
  formatPrice: (price: number, lang: any) => string;
  translateCategory?: (cat: string) => string;
  lang: any;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  selectedFood,
  setSelectedFood,
  isLightboxOpen,
  setIsLightboxOpen,
  selectedSize,
  setSelectedSize,
  selectedAddons,
  setSelectedAddons,
  modalQuantity,
  setModalQuantity,
  modalNote,
  setModalNote,
  handleAddFromModal,
  foodReviews,
  isLoadingReviews,
  fetchFoodReviews,
  isModalAiOpen,
  setIsModalAiOpen,
  modalAiMessages,
  modalAiInput,
  setModalAiInput,
  isModalAiThinking,
  handleSendModalAiMessage,
  SIZE_MULTIPLIERS,
  ADDON_PRICES,
  ADDON_ICONS,
  formatPrice,
  translateCategory,
  lang,
}) => {
  return (
    <>
      {/* ── MODAL: Food Detail ────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedFood && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden font-sans">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedFood(null);
                setIsModalAiOpen(false);
              }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            {/* Modal Card (Mobile Bottom Sheet / Desktop Modal) */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-w-3xl xl:max-w-[820px] bg-white dark:bg-[#090D16] border-t md:border border-slate-200/80 dark:border-slate-800 rounded-t-[32px] md:rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col md:flex-row max-h-[92vh] md:max-h-[85vh]"
            >
              {/* Mobile Drag Indicator Handle */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 md:hidden shrink-0 opacity-60" />

              {/* Left Image Section */}
              <div
                onClick={() => setIsLightboxOpen(true)}
                className="w-full md:w-[44%] h-52 sm:h-64 md:h-auto bg-slate-900/5 dark:bg-slate-900/40 relative flex-shrink-0 cursor-pointer group flex items-center justify-center overflow-hidden"
              >
                <Image
                  src={selectedFood.image}
                  alt={selectedFood.name}
                  fill
                  className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                />

                {/* Top Left Category Badge */}
                <div className="absolute top-3 left-3 z-20">
                  <span className="inline-flex items-center gap-1.5 bg-slate-950/85 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_6px_#f59e0b]" />
                    {translateCategory ? translateCategory(selectedFood.category) : selectedFood.category}
                  </span>
                </div>

                {/* Close Button on Image (Mobile) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFood(null);
                    setIsModalAiOpen(false);
                  }}
                  className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-95 md:hidden"
                  title="Đóng"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>

                {/* Zoom Icon Button */}
                <div className="absolute bottom-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md pointer-events-none shadow-md">
                  <span className="material-symbols-outlined text-base">zoom_in</span>
                </div>
              </div>

              {/* Right Details Section */}
              <div className="w-full md:w-[56%] flex flex-col justify-between bg-white dark:bg-[#090D16] relative overflow-hidden flex-1">
                {/* Desktop Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFood(null);
                    setIsModalAiOpen(false);
                  }}
                  className="hidden md:flex absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Đóng modal"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>

                {/* Scrollable Details Body */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 scrollbar-none">
                  <div className="pr-2 md:pr-8">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                      {selectedFood.name}
                    </h3>
                    
                    <div className="text-xl sm:text-2xl font-black text-[#0284c7] dark:text-[#38BDF8] tracking-tight mt-1">
                      {(() => {
                        const isMilkTea = selectedFood.category?.toLowerCase().includes('trà sữa') || selectedFood.category?.toLowerCase().includes('milk tea');
                        const activeAddons = isMilkTea ? selectedAddons : [];
                        const addonTotal = activeAddons.reduce(
                          (sum, a) => sum + (ADDON_PRICES[a] ?? 0),
                          0
                        );
                        const currentUnitPrice = Math.round(
                          selectedFood.price * SIZE_MULTIPLIERS[selectedSize] + addonTotal
                        );
                        return formatPrice(currentUnitPrice, lang);
                      })()}
                    </div>

                    {/* Ask AI Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalAiOpen(true);
                        if (modalAiMessages.length === 0) {
                          handleSendModalAiMessage(
                            lang === 'en' ? `What makes ${selectedFood.name} special?` : lang === 'zh' ? `${selectedFood.name} 有什么特色？` : `Món ${selectedFood.name} này có vị gì đặc biệt?`
                          );
                        }
                      }}
                      className="mt-2.5 inline-flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 text-[#0284c7] dark:text-[#38BDF8] border border-sky-500/30 rounded-full px-3.5 py-1.5 transition-all active:scale-95 cursor-pointer text-xs font-bold"
                    >
                      <span className="material-symbols-outlined text-base">auto_awesome</span>
                      <span>{lang === 'en' ? 'Ask AI about this item' : lang === 'zh' ? '询问 AI 关于此商品' : 'Hỏi AI về món này'}</span>
                    </button>
                  </div>

                  {/* Size Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                      {lang === 'en' ? 'Size Options' : lang === 'zh' ? '规格 / 尺寸' : 'Kích cỡ / Size'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['S', 'M', 'L'] as const).map((sz) => {
                        const isActive = selectedSize === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSize(sz)}
                            className={`py-2.5 px-3 text-xs font-black rounded-xl border transition-all duration-150 active:scale-95 cursor-pointer text-center ${
                              isActive
                                ? 'border-[#0284c7] dark:border-[#38BDF8] bg-[#0284c7] dark:bg-[#38BDF8] text-white dark:text-slate-950 shadow-md'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-sky-500'
                            }`}
                          >
                            Size {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Topping list (Only for Milk Tea) */}
                  {(() => {
                    const isMilkTea = selectedFood.category?.toLowerCase().includes('trà sữa') || selectedFood.category?.toLowerCase().includes('milk tea');
                    if (!isMilkTea) return null;
                    return (
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                          {lang === 'en' ? 'Toppings / Add-ons' : lang === 'zh' ? '配料 / 加料' : 'Topping / Addon'}
                        </label>
                        <div className="space-y-2">
                          {Object.keys(ADDON_PRICES).map((addonName) => {
                            const isSelected = selectedAddons.includes(addonName);
                            return (
                              <button
                                key={addonName}
                                type="button"
                                onClick={() => {
                                  setSelectedAddons((prev) =>
                                    isSelected
                                      ? prev.filter((a) => a !== addonName)
                                      : [...prev, addonName]
                                  );
                                }}
                                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-between transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-sky-500/10 border-[#0284c7] dark:border-[#38BDF8] text-[#0284c7] dark:text-[#38BDF8]'
                                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-base">
                                    {ADDON_ICONS[addonName] || 'local_offer'}
                                  </span>
                                  <span>{addonName}</span>
                                </div>
                                <span className="font-extrabold text-[11px]">
                                  +{formatPrice(ADDON_PRICES[addonName] ?? 0, lang)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Note Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {lang === 'en' ? 'Special Instructions' : lang === 'zh' ? '备注要求' : 'Ghi chú cho quán'}
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {modalNote.length}/200
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={200}
                      placeholder={lang === 'en' ? 'e.g. less sugar, less ice...' : lang === 'zh' ? '例如：微糖、少冰、不加奶...' : 'Ví dụ: ít đường, ít đá, không sữa...'}
                      value={modalNote}
                      onChange={(e) => setModalNote(e.target.value.slice(0, 200))}
                      className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#0284c7] dark:focus:border-[#38BDF8] transition-all"
                    />
                  </div>

                  {/* Reviews */}
                  {selectedFood &&
                    (() => {
                      if (foodReviews.length === 0 && !isLoadingReviews) {
                        fetchFoodReviews(selectedFood._id);
                      }
                      return null;
                    })()}
                  {foodReviews.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#0284c7] dark:text-[#38BDF8] mb-1">
                        {lang === 'en' ? 'Featured Review' : lang === 'zh' ? '精选评价' : 'Đánh giá nổi bật'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                        "{foodReviews[0]?.foodRating?.comment || (lang === 'en' ? 'Delicious drink!' : lang === 'zh' ? '非常美味！' : 'Món uống rất ngon!')}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Sticky Bottom Action Bar */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-md flex items-center justify-between gap-3 sticky bottom-0 z-20">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 rounded-full p-1 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors active:scale-95 cursor-pointer"
                      title="Giảm số lượng"
                    >
                      <span className="material-symbols-outlined text-base">remove</span>
                    </button>
                    <span className="text-sm font-black text-slate-900 dark:text-white w-6 text-center">
                      {modalQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalQuantity((q) => q + 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors active:scale-95 cursor-pointer"
                      title="Tăng số lượng"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                    </button>
                  </div>

                  {/* Add To Cart Primary Button */}
                  <button
                    type="button"
                    onClick={handleAddFromModal}
                    className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#0284c7] to-[#38BDF8] hover:from-[#0369a1] hover:to-[#0284c7] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>{lang === 'en' ? 'ADD TO CART' : lang === 'zh' ? '加入购物车' : 'THÊM VÀO GIỎ'}</span>
                    <span className="font-extrabold bg-white/20 px-2 py-0.5 rounded-lg text-xs">
                      {(() => {
                        const isMilkTea = selectedFood.category?.toLowerCase().includes('trà sữa') || selectedFood.category?.toLowerCase().includes('milk tea');
                        const activeAddons = isMilkTea ? selectedAddons : [];
                        const addonTotal = activeAddons.reduce(
                          (sum, a) => sum + (ADDON_PRICES[a] ?? 0),
                          0
                        );
                        const currentUnitPrice = Math.round(
                          selectedFood.price * SIZE_MULTIPLIERS[selectedSize] + addonTotal
                        );
                        return formatPrice(currentUnitPrice * modalQuantity, lang);
                      })()}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Lightbox Full-screen Image Viewer ─────────────────────── */}
      <AnimatePresence>
        {isLightboxOpen && selectedFood && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none animate-fade-in">
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-colors"
              title="Đóng xem ảnh"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div className="relative w-full max-w-4xl h-[80vh] flex items-center justify-center">
              <Image
                src={selectedFood.image}
                alt={selectedFood.name}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Modal AI Bottom Sheet Chat ────────────────────────────── */}
      <AnimatePresence>
        {isModalAiOpen && selectedFood && (
          <div className="fixed inset-0 z-[65] flex items-end justify-center select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalAiOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#090D16] border-t border-x border-slate-200 dark:border-slate-800 rounded-t-[28px] shadow-2xl z-10 overflow-hidden flex flex-col h-[70vh] max-h-[500px]"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0284c7] dark:text-[#38BDF8] text-lg">
                    auto_awesome
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    Hỏi AI về {selectedFood.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalAiOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {/* Quick suggestions */}
              <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto scrollbar-none">
                {[
                  `Món ${selectedFood.name} có cay không?`,
                  `Hợp với ai?`,
                  `Nên chọn ít đường không?`,
                ].map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => handleSendModalAiMessage(promptText)}
                    className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0284c7] text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-[#0284c7] whitespace-nowrap transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    {promptText}
                  </button>
                ))}
              </div>

              {/* Message log */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
                {modalAiMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#0284c7] dark:bg-[#38BDF8] text-white dark:text-slate-950 font-semibold shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-white shadow-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isModalAiThinking && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs p-3 rounded-2xl animate-pulse">
                      Kohi AI đang phân tích về món {selectedFood.name}...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex gap-2">
                <input
                  type="text"
                  value={modalAiInput}
                  onChange={(e) => setModalAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendModalAiMessage()}
                  placeholder={`Đặt câu hỏi về ${selectedFood.name}...`}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#0284c7]"
                />
                <button
                  type="button"
                  onClick={() => handleSendModalAiMessage()}
                  disabled={!modalAiInput.trim() || isModalAiThinking}
                  className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Gửi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
