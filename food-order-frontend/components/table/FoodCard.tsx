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
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-220 ease-out p-4 flex items-center gap-4 group cursor-pointer"
      >
        <div
          onClick={handleClick}
          className="w-20 h-20 rounded-[var(--radius-md)] overflow-hidden relative bg-[var(--bg-primary)] cursor-pointer flex-shrink-0"
        >
          <Image
            src={food.image}
            alt={food.name}
            fill
            className="object-cover group-hover:scale-[1.04] transition-transform duration-300 ease-out"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            onClick={handleClick}
            className="text-[15px] font-[600] text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors leading-[1.3] truncate cursor-pointer font-sans mb-1.5"
          >
            {food.name}
          </h3>
          <p className="text-[13px] font-[400] leading-[1.55] text-[var(--text-secondary)] line-clamp-3 mt-0.5 break-words font-sans">
            {food.description}
          </p>
          <span className="text-[16px] font-[700] text-[var(--price-color)] mt-1.5 block font-sans tracking-tight">
            {formatPrice(food.price, lang)}
          </span>
        </div>
        <div className="flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleClick}
            className={`px-4 py-2.5 rounded-[var(--radius-sm)] text-[13px] font-[600] tracking-[0.02em] flex items-center gap-1.5 shadow-sm transition-all ${
              quantity > 0
                ? 'bg-[var(--brand-primary-muted)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/20'
                : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">
              {quantity > 0 ? 'check' : 'add'}
            </span>
            <span>{quantity > 0 ? `Đã chọn (${quantity})` : 'Chọn món'}</span>
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
      className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-220 ease-out overflow-hidden group flex flex-col justify-between h-full cursor-pointer"
    >
      <div className="flex-1 flex flex-col">
        {/* Image cover */}
        <div
          onClick={handleClick}
          className="relative h-48 sm:h-52 xl:h-56 w-full overflow-hidden bg-[var(--bg-primary)] cursor-pointer flex-shrink-0 rounded-t-[var(--radius-lg)]"
        >
          <Image
            src={food.image}
            alt={food.name}
            fill
            className="object-cover object-center group-hover:scale-[1.04] transition-transform duration-300 ease-out"
            sizes="(max-width: 768px) 100vw, 350px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-30 group-hover:opacity-10 transition-opacity" />

          {/* Category Tag Badge */}
          <div className="absolute top-[10px] left-[10px] bg-[var(--brand-primary)]/90 text-white text-[10px] font-[500] uppercase tracking-[0.05em] px-2.5 py-1 rounded-[var(--radius-full)] shadow-sm backdrop-blur-md">
            {translateCategory(food.category)}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3
              onClick={handleClick}
              className="text-[15px] font-[600] text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors leading-[1.3] truncate mb-1.5 cursor-pointer font-sans"
              title={food.name}
            >
              {food.name}
            </h3>

            {food.description && (
              <p className="text-[13px] font-[400] leading-[1.55] text-[var(--text-secondary)] line-clamp-3 mb-3 break-words font-sans min-h-[2.5rem]">
                {food.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 pt-0 mt-auto">
        <div className="border-t border-[var(--border-color)] my-3 pt-3 flex items-center justify-between">
          <span className="text-[16px] font-[700] text-[var(--price-color)] tracking-tight font-sans">
            {formatPrice(food.price, lang)}
          </span>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleClick}
            className={`px-4 py-2.5 rounded-[var(--radius-sm)] text-[13px] font-[600] tracking-[0.02em] flex items-center gap-1.5 shadow-sm transition-all ${
              quantity > 0
                ? 'bg-[var(--brand-primary-muted)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/20'
                : 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">
              {quantity > 0 ? 'check' : 'add'}
            </span>
            <span>{quantity > 0 ? `Đã chọn (${quantity})` : 'Chọn món'}</span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};
