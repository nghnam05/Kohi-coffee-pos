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
      <div>
        <h1 className="text-lg sm:text-xl font-[800] text-[#000000] dark:text-[#FFFFFF] tracking-tight leading-none font-heading group-hover:text-[#38BDF8] transition-colors">
          Kohi
        </h1>
        <p className="hidden sm:block text-[10px] font-[700] text-[#38BDF8] uppercase tracking-[0.05em] mt-0.5 font-sans">
          COFFEE & PASTRY
        </p>
      </div>
    </div>
  );
};

