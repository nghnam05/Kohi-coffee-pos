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
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedFood(null);
                setIsModalAiOpen(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 30 }}
              className="relative w-full max-w-3xl xl:max-w-[820px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-t-2xl md:rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]"
            >
              {/* Mobile Drag Handle */}
              <div className="w-10 h-1 bg-[var(--border-color)] rounded-full mx-auto my-2 md:hidden shrink-0" />

              {/* Left Image Section */}
              <div
                onClick={() => setIsLightboxOpen(true)}
                className="w-full md:w-[44%] min-h-[240px] sm:min-h-[280px] md:min-h-[360px] bg-slate-900/5 dark:bg-slate-900/40 border-b md:border-b-0 md:border-r border-[var(--border-color)] relative flex-shrink-0 cursor-pointer group flex items-center justify-center overflow-hidden"
              >
                <Image
                  src={selectedFood.image}
                  alt={selectedFood.name}
                  fill
                  className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                />

                <div className="absolute bottom-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md pointer-events-none shadow-md">
                  <span className="material-symbols-outlined text-base">zoom_in</span>
                </div>
              </div>

              {/* Right Details Section */}
              <div className="w-full md:w-[56%] flex flex-col justify-between bg-[var(--bg-card)] relative overflow-hidden font-sans">
                {/* Clean Close Button Top-Right of Right Column */}
                <button
                  onClick={() => {
                    setSelectedFood(null);
                    setIsModalAiOpen(false);
                  }}
                  className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Đóng modal"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>

                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 scrollbar-none">
                  <div className="pr-8">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1.5 bg-slate-950/80 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_6px_#f59e0b]" />
                        {translateCategory ? translateCategory(selectedFood.category) : selectedFood.category}
                      </span>
                    </div>
                    <h3 className="text-[20px] sm:text-[22px] font-bold text-[var(--text-primary)] leading-tight">
                      {selectedFood.name}
                    </h3>
                    <div className="text-[22px] font-bold text-[var(--brand-primary)] tracking-tight mt-2">
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
                    </div>

                    <button
                      onClick={() => {
                        setIsModalAiOpen(true);
                        if (modalAiMessages.length === 0) {
                          handleSendModalAiMessage(
                            lang === 'en' ? `What makes ${selectedFood.name} special?` : lang === 'zh' ? `${selectedFood.name} 有什么特色？` : `Món ${selectedFood.name} này có vị gì đặc biệt?`
                          );
                        }
                      }}
                      className="mt-2.5 inline-flex items-center gap-2 bg-[var(--brand-primary-muted)] border border-[var(--brand-primary)]/30 rounded-full px-3.5 py-2 transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base text-[var(--brand-primary)]">
                        auto_awesome
                      </span>
                      <span className="text-[13px] font-semibold text-[var(--brand-primary)] font-sans">
                        {lang === 'en' ? 'Ask AI about this item' : lang === 'zh' ? '询问 AI 关于此商品' : 'Hỏi AI về món này'}
                      </span>
                    </button>
                  </div>

                  {/* Size selector */}
                  <div>
                    <label className="text-[13px] font-semibold text-[var(--text-primary)] tracking-[0.01em] mb-2 block font-sans">
                      {lang === 'en' ? 'Size Options' : lang === 'zh' ? '规格 / 尺寸' : 'Kích cỡ / Size'}
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(['S', 'M', 'L'] as const).map((sz) => {
                        const isActive = selectedSize === sz;
                        return (
                          <button
                            key={sz}
                            onClick={() => setSelectedSize(sz)}
                            className={`py-2.5 px-3 text-[13px] font-semibold rounded-xl border transition-all duration-150 ease-in-out font-sans ${
                              isActive
                                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] shadow-md'
                                : 'border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            Size {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Topping list (Only visible for Milk Tea category) */}
                  {(() => {
                    const isMilkTea = selectedFood.category?.toLowerCase().includes('trà sữa') || selectedFood.category?.toLowerCase().includes('milk tea');
                    if (!isMilkTea) return null;
                    return (
                      <div>
                        <label className="text-[13px] font-semibold text-[var(--text-primary)] tracking-[0.01em] mb-2 block font-sans">
                          {lang === 'en' ? 'Toppings / Add-ons' : lang === 'zh' ? '配料 / 加料' : 'Topping / Addon'}
                        </label>
                        <div className="space-y-2">
                          {Object.keys(ADDON_PRICES).map((addonName) => {
                            const isSelected = selectedAddons.includes(addonName);
                            return (
                              <button
                                key={addonName}
                                onClick={() => {
                                  setSelectedAddons((prev) =>
                                    isSelected
                                      ? prev.filter((a) => a !== addonName)
                                      : [...prev, addonName]
                                  );
                                }}
                                className={`w-full group min-h-[48px] px-[14px] py-2.5 rounded-xl text-[13px] font-medium border flex items-center justify-between transition-all duration-150 font-sans ${
                                  isSelected
                                    ? 'bg-[var(--brand-primary-muted)] border-[var(--brand-primary)] text-[var(--text-primary)] shadow-xs'
                                    : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]'
                                }`}
                              >
                                <div className="flex items-center min-w-0">
                                  <span className="material-symbols-outlined text-[18px] text-[var(--text-tertiary)] group-hover:text-[var(--brand-primary)] mr-2.5 flex-shrink-0 transition-colors">
                                    {ADDON_ICONS[addonName] || 'local_offer'}
                                  </span>
                                  <span className="truncate">{addonName}</span>
                                </div>

                                <div
                                  className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                                    isSelected
                                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] shadow-xs'
                                      : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] group-hover:border-[var(--brand-primary)] group-hover:text-[var(--brand-primary)]'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-sm font-bold">
                                    {isSelected ? 'check' : 'add'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Note Input */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[13px] font-semibold text-[var(--text-primary)] tracking-[0.01em]">
                        {lang === 'en' ? 'Special Instructions' : lang === 'zh' ? '备注要求' : 'Ghi chú cho quán'}
                      </label>
                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        {modalNote.length}/200
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={200}
                      placeholder={lang === 'en' ? 'e.g. less sugar, less ice...' : lang === 'zh' ? '例如：微糖、少冰、不加奶...' : 'Ví dụ: ít đường, ít đá, không sữa...'}
                      value={modalNote}
                      onChange={(e) => setModalNote(e.target.value.slice(0, 200))}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-[14px] py-[12px] text-[13px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15 transition-all shadow-2xs font-sans"
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
                    <div className="bg-[var(--bg-card-inner)] p-3.5 rounded-xl border border-[var(--border-color)]">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-primary)] mb-1 font-sans">
                        {lang === 'en' ? 'Featured Review' : lang === 'zh' ? '精选评价' : 'Đánh giá nổi bật'}
                      </p>
                      <p className="text-[12px] text-[var(--text-secondary)] italic font-sans">
                        "{foodReviews[0]?.foodRating?.comment || (lang === 'en' ? 'Delicious drink!' : lang === 'zh' ? '非常美味！' : 'Món uống rất ngon!')}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Sticky Footer */}
                <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between gap-3 shadow-lg sticky bottom-0 z-20 font-sans">
                  <div className="flex items-center gap-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full p-1 shadow-2xs">
                    <button
                      onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-card-inner)] transition-colors active:scale-95 cursor-pointer"
                      title="Giảm số lượng"
                    >
                      <span className="material-symbols-outlined text-base">remove</span>
                    </button>
                    <span className="text-[14px] font-bold text-[var(--text-primary)] w-6 text-center font-sans">
                      {modalQuantity}
                    </span>
                    <button
                      onClick={() => setModalQuantity((q) => q + 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-card-inner)] transition-colors active:scale-95 cursor-pointer"
                      title="Tăng số lượng"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                    </button>
                  </div>

                  <button
                    onClick={handleAddFromModal}
                    className="flex-1 uiverse-btn py-3.5 px-6 rounded-xl text-[14px] font-bold uppercase tracking-[0.02em] shadow-md transition-all active:scale-95 flex items-center justify-center cursor-pointer text-[var(--brand-primary-fg)] font-sans"
                  >
                    <span>{lang === 'en' ? 'ADD TO CART' : lang === 'zh' ? '加入购物车' : 'THÊM VÀO GIỎ'}</span>
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
              className="relative w-full max-w-2xl bg-[var(--bg-card)] border-t border-x border-[var(--border-color)] rounded-t-[var(--radius-lg)] shadow-2xl z-10 overflow-hidden flex flex-col h-[70vh] max-h-[500px]"
            >
              <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-primary)]">
                <div className="flex items-center gap-2 font-sans">
                  <span className="material-symbols-outlined text-[var(--brand-primary)] text-lg">
                    auto_awesome
                  </span>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] truncate font-sans">
                    Hỏi AI về {selectedFood.name}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalAiOpen(false)}
                  className="w-7 h-7 rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center border border-[var(--border-color)]"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {/* Quick suggestions */}
              <div className="px-4 py-2 bg-[var(--bg-primary)]/50 border-b border-[var(--border-color)] flex gap-2 overflow-x-auto scrollbar-none">
                {[
                  `Món ${selectedFood.name} có cay không?`,
                  `Hợp với ai?`,
                  `Nên chọn ít đường không?`,
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => handleSendModalAiMessage(promptText)}
                    className="px-3 py-1.5 rounded-[var(--radius-full)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#0284c7] dark:hover:border-[#38BDF8] text-[11px] font-medium text-[var(--text-secondary)] hover:text-[#0284c7] dark:hover:text-[#38BDF8] whitespace-nowrap transition-all shadow-sm active:scale-95 cursor-pointer"
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
                      className={`max-w-[85%] p-3 rounded-[var(--radius-md)] text-[13.5px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#0284c7] dark:bg-[#38BDF8] text-white dark:text-slate-950 font-medium shadow-sm'
                          : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isModalAiThinking && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-xs p-3 rounded-[var(--radius-md)] animate-pulse">
                      Kohi AI đang phân tích về món {selectedFood.name}...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-primary)] flex gap-2">
                <input
                  type="text"
                  value={modalAiInput}
                  onChange={(e) => setModalAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendModalAiMessage()}
                  placeholder={`Đặt câu hỏi về ${selectedFood.name}...`}
                  className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-sm)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--brand-primary)]"
                />
                <button
                  onClick={() => handleSendModalAiMessage()}
                  disabled={!modalAiInput.trim() || isModalAiThinking}
                  className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white px-3 py-2 rounded-[var(--radius-sm)] text-xs font-semibold transition-colors disabled:opacity-50"
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
