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
}) => {
  const handleClick = () => {
    onSelectFood(food, quantity > 0 ? quantity : 1, cartItemNote);
  };

  if (viewMode === 'list') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.985 }}
        className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] hover:shadow-md dark:hover:shadow-[0_12px_28px_-4px_rgba(59,130,246,0.25)] hover:border-blue-500/40 transition-all duration-200 ease-out p-4 flex items-center gap-4 group cursor-pointer"
      >
        <div
          onClick={handleClick}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden relative bg-slate-100 dark:bg-slate-950/60 cursor-pointer flex-shrink-0 border border-slate-200/60 dark:border-white/5"
        >
          <Image
            src={food.image}
            alt={food.name}
            fill
            sizes="(max-width: 640px) 96px, 120px"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-300 ease-out relative z-0"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
              <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
              {translateCategory(food.category)}
            </span>
          </div>
          <h3
            onClick={handleClick}
            className="text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-[1.3] truncate cursor-pointer font-sans mb-1"
          >
            {food.name}
          </h3>
          <p className="text-[12.5px] font-normal leading-[1.5] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 break-words font-sans">
            {food.description}
          </p>
          <span className="text-[16px] font-extrabold text-[#0284c7] dark:text-sky-400 mt-1.5 block font-sans tracking-tight">
            {formatPrice(food.price, lang)}
          </span>
        </div>
        <div className="flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleClick}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl text-[13px] font-bold tracking-[0.02em] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              quantity > 0
                ? 'bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 dark:border-blue-500/40 hover:bg-blue-500/25'
                : 'uiverse-btn'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">
              {quantity > 0 ? 'check' : 'add'}
            </span>
            <span>
              {quantity > 0
                ? (lang === 'en' ? `Selected (${quantity})` : lang === 'zh' ? `已选择 (${quantity})` : `Đã chọn (${quantity})`)
                : (lang === 'en' ? 'Select' : lang === 'zh' ? '选择' : 'Chọn món')}
            </span>
          </motion.button>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -6, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-sm dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] hover:shadow-lg dark:hover:shadow-[0_12px_28px_-4px_rgba(59,130,246,0.25)] hover:border-blue-500/40 transition-all duration-200 ease-out overflow-hidden group flex flex-col justify-between h-full cursor-pointer"
    >
      <div className="flex-1 flex flex-col">
        {/* Image cover */}
        <div
          onClick={handleClick}
          className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-950/60 cursor-pointer flex-shrink-0 group"
        >
          {/* Full width cover image */}
          <Image
            src={food.image}
            alt={food.name}
            fill
            className="object-cover group-hover:scale-[1.04] transition-transform duration-300 ease-out relative z-0"
            sizes="(max-width: 768px) 100vw, 350px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity pointer-events-none z-0" />

          {/* Category Tag Badge */}
          <div className="absolute top-2.5 left-2.5 z-10 bg-slate-950/85 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg backdrop-blur-md font-sans flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_6px_#f59e0b]" />
            <span>{translateCategory(food.category)}</span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3
              onClick={handleClick}
              className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-[1.3] truncate mb-1.5 cursor-pointer font-sans"
              title={food.name}
            >
              {food.name}
            </h3>

            {food.description && (
              <p className="text-[12.5px] sm:text-[13px] font-normal leading-[1.5] text-slate-500 dark:text-slate-400 line-clamp-3 mb-3 break-words font-sans min-h-[2.5rem]">
                {food.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 pt-0 mt-auto">
        <div className="border-t border-slate-100 dark:border-white/10 my-3 pt-3 flex items-center justify-between">
          <span className="text-[16px] sm:text-[18px] font-black text-[#0284c7] dark:text-sky-400 tracking-tight font-sans">
            {formatPrice(food.price, lang)}
          </span>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleClick}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-[13px] font-bold tracking-[0.02em] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              quantity > 0
                ? 'bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 dark:border-blue-500/40 hover:bg-blue-500/25 font-bold'
                : 'uiverse-btn'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">
              {quantity > 0 ? 'check' : 'add'}
            </span>
            <span>
              {quantity > 0
                ? (lang === 'en' ? `Selected (${quantity})` : lang === 'zh' ? `已选择 (${quantity})` : `Đã chọn (${quantity})`)
                : (lang === 'en' ? 'Select' : lang === 'zh' ? '选择' : 'Chọn món')}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};
