'use client';

import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  onClick?: () => void;
}

export const KOHI_LOGO_URL = '/images/kohi-logo.png?v=2';

export const BrandLogo: React.FC<BrandLogoProps> = ({ onClick }) => {
  return (
    <div className="flex items-center gap-2.5 cursor-pointer select-none group" onClick={onClick}>
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/80 shadow-sm bg-white flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
        <Image
          alt="Kohi Coffee Logo"
          className="w-full h-full object-cover"
          src={KOHI_LOGO_URL}
          width={48}
          height={48}
          priority
        />
      </div>
      <div className="flex flex-col justify-center">
        <span
          style={{ fontFamily: 'var(--font-outfit), var(--font-manrope), var(--font-inter), system-ui, sans-serif' }}
          className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-[0.16em] uppercase leading-none group-hover:text-[#38BDF8] transition-colors"
        >
          KOHI
        </span>
        <span className="text-[7.5px] sm:text-[9px] font-extrabold text-[#38BDF8] dark:text-[#38BDF8] uppercase tracking-[0.22em] mt-1 leading-none font-sans">
          COFFEE & PASTRY
        </span>
      </div>
    </div>
  );
};

