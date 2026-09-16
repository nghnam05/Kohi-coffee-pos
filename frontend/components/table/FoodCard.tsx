'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export interface Food {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
  available?: boolean;
  rating?: number;
  totalReviews?: number;
  soldCount?: number;
  prepTimeMinutes?: number;
  sizeOptions?: Array<{ name: string; priceModifier: number }>;
  customizationGroups?: Array<{
    name: string;
    required: boolean;
    allowMultiple: boolean;
    options: Array<{ name: string; priceModifier: number }>;
  }>;
}

interface FoodCardProps {
  food: any;
  viewMode: 'grid' | 'list';
  quantity: number;
  cartItemNote?: string;
  formatPrice: (price: number, lang: any) => string;
  translateCategory: (category: string) => string;
  lang: any;
  onSelectFood: (food: any, initialQty: number, note: string) => void;
  index?: number;
}

/**
 * Minimalist Artisan FoodCard inspired by % Arabica and Blue Bottle aesthetics:
 * - Focuses on appetizing product photography
 * - Muted, elegant typography without visual badge clutter
 * - Calm, tactile interactions with generous whitespace
 */
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

  const isBestSeller = index === 0 || index === 1 || (index !== undefined && index % 5 === 0);

  if (viewMode === 'list') {
    return (
      <motion.article
        initial={isAboveFold ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
        {...(isAboveFold ? {} : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-20px' } })}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
        className="bg-white dark:bg-[#131926] border border-slate-200/70 dark:border-white/10 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 p-3 sm:p-3.5 flex items-center gap-3.5 group cursor-pointer"
      >
        {/* Product Photo */}
        <div
          onClick={handleClick}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden relative bg-slate-100 dark:bg-[#0E131F] cursor-pointer flex-shrink-0 border border-slate-100 dark:border-white/5"
        >
          <Image
            src={food.image}
            alt={food.name}
            fill
            priority={isPriority}
            sizes="(max-width: 640px) 96px, 120px"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out relative z-0"
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
          <div>
            {/* Subtle Minimalist Tags */}
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className="inline-flex items-center text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                {translateCategory(food.category)}
              </span>
              {isBestSeller && (
                <span className="inline-flex items-center text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                  {lang === 'en' ? 'Signature' : lang === 'zh' ? '招牌' : 'Đặc trưng'}
                </span>
              )}
            </div>

            {/* Food Title */}
            <h3
              onClick={handleClick}
              className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors leading-snug line-clamp-1 cursor-pointer font-sans"
              title={food.name}
            >
              {food.name}
            </h3>

            {/* Subtle Rating & Details */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-400 my-0.5 font-sans">
              <span className="flex items-center gap-0.5 text-amber-500/90 dark:text-amber-400/90 font-bold">
                <span className="material-symbols-outlined text-[13px] fill-current leading-none" aria-hidden="true">star</span>
                <span>{(food.rating || 5.0).toFixed(1)}</span>
              </span>
              {food.totalReviews !== undefined && food.totalReviews > 0 ? (
                <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                  ({food.totalReviews})
                </span>
              ) : null}
              <span className="text-slate-300 dark:text-slate-600 leading-none" aria-hidden="true">•</span>
              <span className="font-medium text-slate-500 dark:text-slate-400 text-[11px]">
                {lang === 'en'
                  ? `${food.soldCount || 0} ordered`
                  : lang === 'zh'
                  ? `已售 ${food.soldCount || 0}`
                  : `Đã gọi ${food.soldCount || 0}`}
              </span>
            </div>

            <p className="text-[11.5px] font-normal leading-normal text-slate-500 dark:text-slate-400 line-clamp-1 break-words font-sans mt-0.5">
              {food.description || (lang === 'en' ? 'Artisan handcrafted recipe' : 'Công thức pha chế thủ công')}
            </p>
          </div>

          <div className="flex items-center justify-between mt-1 pt-0.5">
            <span className="text-[15px] sm:text-[16px] font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              {formatPrice(food.price, lang)}
            </span>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleClick}
              aria-label={`${quantity > 0 ? (lang === 'en' ? 'Selected' : lang === 'zh' ? '已选择' : 'Đã chọn') : (lang === 'en' ? 'Select' : lang === 'zh' ? '选择' : 'Chọn')} ${food.name}, ${formatPrice(food.price, lang)}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide flex items-center gap-1 transition-all cursor-pointer font-sans ${
                quantity > 0
                  ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 shadow-xs'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
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

  // Grid View
  return (
    <motion.article
      initial={isAboveFold ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      {...(isAboveFold ? {} : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-30px' } })}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      className="bg-white dark:bg-[#131926] border border-slate-200/70 dark:border-white/10 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col justify-between h-full cursor-pointer"
    >
      <div className="flex-1 flex flex-col">
        {/* Appetizing Product Image */}
        <div
          onClick={handleClick}
          className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-[#0E131F] cursor-pointer flex-shrink-0 group"
        >
          <Image
            src={food.image}
            alt={food.name}
            fill
            priority={isPriority}
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out relative z-0"
            sizes="(max-width: 768px) 100vw, 350px"
          />

          {/* Clean Category Badge */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="inline-flex items-center text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-md bg-white/90 dark:bg-[#0E131F]/90 text-slate-700 dark:text-slate-200 backdrop-blur-xs border border-slate-200/50 dark:border-white/10 shadow-2xs">
              {translateCategory(food.category)}
            </span>
          </div>

          {isBestSeller && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="inline-flex items-center text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-md bg-sky-50/95 dark:bg-sky-950/90 text-sky-700 dark:text-sky-300 border border-sky-400/20 backdrop-blur-xs shadow-2xs">
                {lang === 'en' ? 'Signature' : lang === 'zh' ? '招牌' : 'Đặc trưng'}
              </span>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-3.5 flex-1 flex flex-col justify-between">
          <div>
            <h3
              onClick={handleClick}
              className="text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors leading-snug line-clamp-1 mb-1 cursor-pointer font-sans"
              title={food.name}
            >
              {food.name}
            </h3>

            {/* Rating & Sold Indicator */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-400 mb-1.5 font-sans flex-wrap">
              <span className="flex items-center gap-0.5 text-amber-500/90 dark:text-amber-400/90 font-bold">
                <span className="material-symbols-outlined text-[13px] fill-current leading-none" aria-hidden="true">star</span>
                <span>{(food.rating || 5.0).toFixed(1)}</span>
              </span>
              {food.totalReviews !== undefined && food.totalReviews > 0 ? (
                <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                  ({food.totalReviews})
                </span>
              ) : null}
              <span className="text-slate-300 dark:text-slate-600 leading-none" aria-hidden="true">•</span>
              <span className="font-medium text-slate-500 dark:text-slate-400 text-[11px]">
                {lang === 'en'
                  ? `${food.soldCount || 0} ordered`
                  : lang === 'zh'
                  ? `已售 ${food.soldCount || 0}`
                  : `Đã gọi ${food.soldCount || 0}`}
              </span>
            </div>

            <p className="text-[11.5px] font-normal leading-normal text-slate-500 dark:text-slate-400 line-clamp-1 break-words font-sans">
              {food.description || (lang === 'en' ? 'Artisan handcrafted recipe' : 'Công thức pha chế thủ công')}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3.5 pt-0 mt-auto">
        <div className="border-t border-slate-100 dark:border-white/10 pt-2.5 flex items-center justify-between">
          <span className="text-[16px] sm:text-[17px] font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
            {formatPrice(food.price, lang)}
          </span>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleClick}
            aria-label={`${quantity > 0 ? (lang === 'en' ? 'Selected' : lang === 'zh' ? '已选择' : 'Đã chọn') : (lang === 'en' ? 'Select' : lang === 'zh' ? '选择' : 'Chọn')} ${food.name}, ${formatPrice(food.price, lang)}`}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide flex items-center gap-1 transition-all cursor-pointer font-sans ${
              quantity > 0
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                : 'bg-slate-900 hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 shadow-xs'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
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
