'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface Food {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
}

type Lang = 'vi' | 'en' | 'zh';

interface FoodCardProps {
  food: Food;
  viewMode: 'grid' | 'list';
  quantity: number;
  cartItemNote?: string;
  formatPrice: (price: number, lang: Lang) => string;
  translateCategory: (cat: string) => string;
  lang: Lang;
  onSelectFood: (food: Food, initialQty: number, note: string) => void;
  index?: number;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  food,
  viewMode,
  quantity,
  cartItemNote = '',
  formatPrice,
  translateCategory,
  lang,
  onSelectFood,
  index,
}) => {
  const isAboveFold = index !== undefined && index < 6;
  const isPriority = index !== undefined && index < 4;

  const handleClick = () => {
    onSelectFood(food, quantity > 0 ? quantity : 1, cartItemNote);
  };

  const getCategoryBadgeClass = (category: string) => {
    const lower = (category || '').toLowerCase();
    if (lower.includes('đá xay') || lower.includes('cà phê') || lower.includes('coffee') || lower.includes('smoothie')) {
      return 'bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-500/20';
    }
    if (lower.includes('bánh') || lower.includes('cake') || lower.includes('pastry') || lower.includes('macaron')) {
      return 'bg-purple-100/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-500/20';
    }
    if (lower.includes('nhẹ') || lower.includes('snack') || lower.includes('trái cây')) {
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10';
    }
    return 'bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-500/20';
  };

  const isHot = index === 0 || (index !== undefined && index % 6 === 0) || food.name.toLowerCase().includes('cheesecake');

  if (viewMode === 'list') {
    return (
      <motion.article
        initial={isAboveFold ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
        {...(isAboveFold ? {} : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-20px' } })}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
        className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 p-3 sm:p-3.5 flex items-center gap-3.5 group cursor-pointer"
      >
        <div
          onClick={handleClick}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden relative bg-slate-100 dark:bg-slate-950/60 cursor-pointer flex-shrink-0 border border-slate-200/50 dark:border-white/5"
        >
          <Image
            src={food.image}
            alt={food.name}
            fill
            priority={isPriority}
            sizes="(max-width: 640px) 96px, 120px"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-300 ease-out relative z-0"
          />
          {isHot && (
            <div className="absolute top-1.5 left-1.5 z-10 bg-[#EF4444] text-white text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-xs">
              HOT
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
          <div>
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className={`inline-flex items-center text-[9.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${getCategoryBadgeClass(food.category)}`}>
                {translateCategory(food.category)}
              </span>
              {(index === 0 || index === 1 || index === 2 || (index !== undefined && index % 4 === 0)) && (
                <span className="inline-flex items-center bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[9.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md">
                  {lang === 'en' ? 'Best Seller' : lang === 'zh' ? '热销' : 'Bán chạy'}
                </span>
              )}
            </div>
            <h3
              onClick={handleClick}
              className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-1 cursor-pointer font-sans"
              title={food.name}
            >
              {food.name}
            </h3>
            <p className="text-[11.5px] sm:text-xs font-normal leading-normal text-slate-400 dark:text-slate-400 line-clamp-1 break-words font-sans mt-0.5">
              {food.description || (lang === 'en' ? 'Signature handcrafted flavor' : 'Hương vị đặc trưng chuẩn Kohi')}
            </p>
          </div>

          <div className="flex items-center justify-between mt-1 pt-0.5">
            <span className="text-[15px] sm:text-[16px] font-bold text-[#2563EB] dark:text-sky-400 font-sans tracking-tight">
              {formatPrice(food.price, lang)}
            </span>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClick}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide flex items-center gap-1 shadow-xs transition-all cursor-pointer font-sans ${
                quantity > 0
                  ? 'bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-sm'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {quantity > 0 ? 'check' : 'add'}
              </span>
              <span>
                {quantity > 0
                  ? (lang === 'en' ? `Selected (${quantity})` : lang === 'zh' ? `已选择 (${quantity})` : `Đã chọn (${quantity})`)
                  : (lang === 'en' ? 'Select' : lang === 'zh' ? '选择' : 'Chọn')}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={isAboveFold ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      {...(isAboveFold ? {} : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-30px' } })}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col justify-between h-full cursor-pointer"
    >
      <div className="flex-1 flex flex-col">
        {/* Image cover */}
        <div
          onClick={handleClick}
          className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-950/60 cursor-pointer flex-shrink-0 group"
        >
          <Image
            src={food.image}
            alt={food.name}
            fill
            priority={isPriority}
            className="object-cover group-hover:scale-[1.04] transition-transform duration-300 ease-out relative z-0"
            sizes="(max-width: 768px) 100vw, 350px"
          />
          {isHot && (
            <div className="absolute top-2 left-2 z-10 bg-[#EF4444] text-white text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-xs">
              HOT
            </div>
          )}

          {/* Category Tag Badge */}
          <div className="absolute top-2 right-2 z-10">
            <span className={`inline-flex items-center text-[9.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs ${getCategoryBadgeClass(food.category)}`}>
              {translateCategory(food.category)}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-3.5 flex-1 flex flex-col justify-between">
          <div>
            <h3
              onClick={handleClick}
              className="text-[14.5px] sm:text-[15.5px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-1 mb-1 cursor-pointer font-sans"
              title={food.name}
            >
              {food.name}
            </h3>

            <p className="text-[11.5px] sm:text-xs font-normal leading-normal text-slate-400 dark:text-slate-400 line-clamp-1 break-words font-sans">
              {food.description || (lang === 'en' ? 'Signature handcrafted flavor' : 'Hương vị đặc trưng chuẩn Kohi')}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3.5 pt-0 mt-auto">
        <div className="border-t border-slate-100 dark:border-white/10 pt-2.5 flex items-center justify-between">
          <span className="text-[16px] sm:text-[17px] font-bold text-[#2563EB] dark:text-sky-400 tracking-tight font-sans">
            {formatPrice(food.price, lang)}
          </span>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide flex items-center gap-1 shadow-xs transition-all cursor-pointer font-sans ${
              quantity > 0
                ? 'bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">
              {quantity > 0 ? 'check' : 'add'}
            </span>
            <span>
              {quantity > 0
                ? (lang === 'en' ? `Selected (${quantity})` : lang === 'zh' ? `已选择 (${quantity})` : `Đã chọn (${quantity})`)
                : (lang === 'en' ? 'Select' : lang === 'zh' ? '选择' : 'Chọn')}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};
