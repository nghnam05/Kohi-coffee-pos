'use client';

import React from 'react';

interface BrandLogoProps {
  onClick?: () => void;
}

export const KOHI_LOGO_URL = '/images/kohi-logo.png';

export const BrandLogo: React.FC<BrandLogoProps> = ({ onClick }) => {
  return (
    <div className="flex items-center gap-2.5 cursor-pointer select-none group" onClick={onClick}>
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-[#E2E8F0] dark:border-[#222732] shadow-xs bg-[#000000] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
        <img
          alt="Kohi Coffee Logo"
          className="w-full h-full object-cover"
          src={KOHI_LOGO_URL}
        />
      </div>
      <div>
        <h1 className="text-base sm:text-lg font-[800] text-[#000000] dark:text-[#FFFFFF] tracking-tight leading-none font-heading group-hover:text-[#38BDF8] transition-colors">
          Kohi
        </h1>
        <p className="hidden sm:block text-[9.5px] font-[700] text-[#38BDF8] uppercase tracking-[0.05em] mt-0.5 font-sans">
          COFFEE & PASTRY
        </p>
      </div>
    </div>
  );
};

