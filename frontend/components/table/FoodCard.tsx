'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AppIcon } from '@/components/common/DashboardIcon';
import { StatusDot } from '@/components/ui/StatusDot';

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
 * FoodCard — NameThatUI Pattern: /web/card & /web/status-dot
 * Specification: Standard Card structure with Media header, Tags, Content, and Footer Action.
 * Adheres strictly to Logic Immutability (preserves onSelectFood, handleClick, quantity, formatPrice).
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

  if (food.isAvailable === false || food.available === false) {
    return null;
  }

  const handleClick = () => {
    onSelectFood(food, quantity > 0 ? quantity : 1, cartItemNote);
  };

  const isBestSeller = index === 0 || index === 1 || (index !== undefined && index % 5 === 0);

  // NameThatUI Card: List View
  if (viewMode === 'list') {
    return (
      <motion.article
        initial={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
        className="bg-white dark:bg-[#090D16] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs hover:shadow-md hover:border-[#38BDF8]/40 dark:hover:border-[#38BDF8]/50 transition-all duration-200 p-3 sm:p-3.5 flex items-center gap-3.5 group cursor-pointer"
      >
        {/* Media Container */}
        <div
          onClick={handleClick}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden relative bg-slate-100 dark:bg-black cursor-pointer shrink-0 border border-slate-100 dark:border-white/5"
        >
          <Image
            src={food.image}
            alt={food.name}
            fill
            priority={isPriority}
            unoptimized={Boolean(food.image?.startsWith('data:') || food.image?.startsWith('blob:'))}
            sizes="(max-width: 640px) 96px, 120px"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out relative z-0"
          />
        </div>

        {/* Card Body */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
          <div>
            {/* Category & Status Tags */}
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className="inline-flex items-center text-[10px] font-normal tracking-wide px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                {translateCategory(food.category)}
              </span>
              {isBestSeller && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold tracking-wide px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-[#38BDF8] border border-[#38BDF8]/30">
                  <StatusDot status="serving" size="sm" ping={false} />
                  {lang === 'en' ? 'Signature' : lang === 'zh' ? '招牌' : 'Đặc trưng'}
                </span>
              )}
            </div>

            {/* Title */}
            <h3
              onClick={handleClick}
              className="text-[15px] sm:text-base font-extrabold text-slate-900 dark:text-white group-hover:text-[#38BDF8] transition-colors leading-snug line-clamp-1 cursor-pointer font-sans"
              title={food.name}
            >
              {food.name}
            </h3>

            {/* Rating & Sold Indicator */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-400 my-0.5 font-sans">
              <span className="flex items-center gap-0.5 text-amber-400 font-extrabold">
                <AppIcon name="star" className="text-[13px] fill-current leading-none" aria-hidden="true" />
                <span>{(food.rating || 5.0).toFixed(1)}</span>
              </span>
              {food.totalReviews !== undefined && food.totalReviews > 0 ? (
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-normal">
                  ({food.totalReviews})
                </span>
              ) : null}
              <span className="text-slate-300 dark:text-slate-600 leading-none" aria-hidden="true">•</span>
              <span className="font-normal text-slate-500 dark:text-slate-400 text-[11px]">
                {lang === 'en'
                  ? `${food.soldCount || 0} ordered`
                  : lang === 'zh'
                  ? `已售 ${food.soldCount || 0}`
                  : ` ${food.soldCount || 0}  lượt gọi`}
              </span>
            </div>

            <p className="text-[11.5px] font-normal leading-normal text-slate-500 dark:text-slate-400 line-clamp-1 break-words font-sans mt-0.5">
              {food.description || (lang === 'en' ? 'Artisan handcrafted recipe' : 'Công thức pha chế thủ công')}
            </p>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-between mt-1 pt-0.5">
            <span className="text-[16px] sm:text-[17px] font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
              {formatPrice(food.price, lang)}
            </span>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleClick}
              aria-label={`${quantity > 0 ? (lang === 'en' ? 'Added' : lang === 'zh' ? '已添加' : 'Đã thêm') : (lang === 'en' ? 'Add' : lang === 'zh' ? '添加' : 'Thêm')} ${food.name}, ${formatPrice(food.price, lang)}`}
              className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-[13px] font-extrabold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer font-sans min-h-[38px] sm:min-h-[42px] ${
                quantity > 0
                  ? 'bg-sky-500/20 text-[#38BDF8] border-2 border-[#38BDF8]/60 shadow-xs'
                  : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sm hover:shadow-md hover:shadow-sky-500/25'
              }`}
            >
              <AppIcon name={quantity > 0 ? 'check' : 'add'} className="text-[16px] sm:text-[17px] text-white" aria-hidden="true" />
              <span className={quantity > 0 ? 'text-[#38BDF8]' : 'text-white'}>
                {quantity > 0
                  ? (lang === 'en' ? `Added (${quantity})` : lang === 'zh' ? `已添加 (${quantity})` : `Đã thêm (${quantity})`)
                  : (lang === 'en' ? 'Add' : lang === 'zh' ? '添加' : 'Thêm')}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.article>
    );
  }

  // NameThatUI Card: Grid View
  return (
    <motion.article
      initial={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      className="bg-white dark:bg-[#090D16] border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs hover:shadow-md hover:border-[#38BDF8]/40 dark:hover:border-[#38BDF8]/50 transition-all duration-200 overflow-hidden group flex flex-col justify-between h-full cursor-pointer"
    >
      <div className="flex-1 flex flex-col">
        {/* Media Container */}
        <div
          onClick={handleClick}
          className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-black cursor-pointer shrink-0 group"
        >
          <Image
            src={food.image}
            alt={food.name}
            fill
            priority={isPriority}
            unoptimized={Boolean(food.image?.startsWith('data:') || food.image?.startsWith('blob:'))}
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out relative z-0"
            sizes="(max-width: 768px) 100vw, 350px"
          />

          {/* Clean Category Badge */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="inline-flex items-center text-[10px] font-normal tracking-wide px-2 py-0.5 rounded-md bg-white/90 dark:bg-[#090D16]/90 text-slate-700 dark:text-slate-200 backdrop-blur-xs border border-slate-200/50 dark:border-white/10 shadow-2xs">
              {translateCategory(food.category)}
            </span>
          </div>

          {/* Best Seller Badge with StatusDot Presence */}
          {isBestSeller && (
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-wide px-2 py-0.5 rounded-md bg-sky-50/95 dark:bg-[#090D16]/95 text-[#38BDF8] border border-[#38BDF8]/30 backdrop-blur-xs shadow-2xs">
                <StatusDot status="serving" size="sm" ping={false} />
                {lang === 'en' ? 'Signature' : lang === 'zh' ? '招牌' : 'Đặc trưng'}
              </span>
            </div>
          )}
        </div>

        {/* Card Body Content */}
        <div className="p-3.5 flex-1 flex flex-col justify-between">
          <div>
            <h3
              onClick={handleClick}
              className="text-[15px] font-extrabold text-slate-900 dark:text-white group-hover:text-[#38BDF8] transition-colors leading-snug line-clamp-1 mb-1 cursor-pointer font-sans"
              title={food.name}
            >
              {food.name}
            </h3>

            {/* Rating & Sold Indicator */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-400 mb-1.5 font-sans flex-wrap">
              <span className="flex items-center gap-0.5 text-amber-400 font-extrabold">
                <AppIcon name="star" className="text-[13px] fill-current leading-none" aria-hidden="true" />
                <span>{(food.rating || 5.0).toFixed(1)}</span>
              </span>
              {food.totalReviews !== undefined && food.totalReviews > 0 ? (
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-normal">
                  ({food.totalReviews})
                </span>
              ) : null}
              <span className="text-slate-300 dark:text-slate-600 leading-none" aria-hidden="true">•</span>
              <span className="font-normal text-slate-500 dark:text-slate-400 text-[11px]">
                {lang === 'en'
                  ? `${food.soldCount || 0} ordered`
                  : lang === 'zh'
                  ? `已售 ${food.soldCount || 0}`
                  : `Lượt gọi ${food.soldCount || 0}`}
              </span>
            </div>

            <p className="text-[11.5px] font-normal leading-normal text-slate-500 dark:text-slate-400 line-clamp-1 break-words font-sans">
              {food.description || (lang === 'en' ? 'Artisan handcrafted recipe' : 'Công thức pha chế thủ công')}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-3.5 pt-0 mt-auto">
        <div className="border-t border-slate-100 dark:border-white/10 pt-2.5 flex items-center justify-between gap-2">
          <span className="text-[16px] sm:text-[17px] font-extrabold text-slate-900 dark:text-white tracking-tight font-sans whitespace-nowrap">
            {formatPrice(food.price, lang)}
          </span>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleClick}
            aria-label={`${quantity > 0 ? (lang === 'en' ? 'Added' : lang === 'zh' ? '已添加' : 'Đã thêm') : (lang === 'en' ? 'Add' : lang === 'zh' ? '添加' : 'Thêm')} ${food.name}, ${formatPrice(food.price, lang)}`}
            className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-[13px] font-extrabold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer font-sans shrink-0 whitespace-nowrap min-h-[38px] sm:min-h-[42px] ${
              quantity > 0
                ? 'bg-sky-500/20 text-[#38BDF8] border-2 border-[#38BDF8]/60 shadow-xs'
                : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sm hover:shadow-md hover:shadow-sky-500/25'
            }`}
          >
            <AppIcon name={quantity > 0 ? 'check' : 'add'} className="text-[16px] sm:text-[17px] shrink-0 text-white" aria-hidden="true" />
            <span className={`whitespace-nowrap ${quantity > 0 ? 'text-[#38BDF8]' : 'text-white'}`}>
              {quantity > 0
                ? (lang === 'en' ? `Added (${quantity})` : lang === 'zh' ? `已添加 (${quantity})` : `Đã thêm (${quantity})`)
                : (lang === 'en' ? 'Add' : lang === 'zh' ? '添加' : 'Thêm')}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};
