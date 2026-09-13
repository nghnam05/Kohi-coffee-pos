'use client';

import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  onClick?: () => void;
  className?: string;
}

export const KOHI_LOGO_URL = '/images/kohi-logo.png?v=2';

export const BrandLogo: React.FC<BrandLogoProps> = ({ onClick, className = '' }) => {
  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 cursor-pointer select-none group shrink-0 transition-transform active:scale-[0.98] ${className}`}
      onClick={onClick}
    >
      {/* Circular Logo Container with subtle premium accent border & hover glow */}
      <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full p-[1.5px] bg-gradient-to-br from-sky-400/50 via-transparent to-slate-300/80 dark:to-white/10 shadow-xs flex-shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-sky-500/20">
        <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-[#090D16] flex items-center justify-center border border-slate-100 dark:border-white/5">
          <Image
            alt="Kohi Coffee Logo"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            src={KOHI_LOGO_URL}
            width={48}
            height={48}
            priority
          />
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center leading-none">
        <span
          style={{ fontFamily: 'var(--font-outfit), var(--font-inter), system-ui, sans-serif' }}
          className="text-lg sm:text-[22px] font-extrabold text-[#090D16] dark:text-white tracking-[0.16em] sm:tracking-[0.18em] uppercase group-hover:text-[#38BDF8] transition-colors duration-200"
        >
          KOHI
        </span>
        <span
          style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
          className="hidden sm:block text-[9px] font-extrabold text-[#38BDF8] dark:text-[#38BDF8] uppercase tracking-[0.28em] mt-1"
        >
          COFFEE & PASTRY
        </span>
      </div>
    </div>
  );
};

