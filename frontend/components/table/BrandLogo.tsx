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
        <h1
          style={{ fontFamily: 'var(--font-pinyon), "Pinyon Script", cursive' }}
          className="text-3xl sm:text-[34px] font-normal text-slate-900 dark:text-white tracking-wide leading-none group-hover:text-sky-400 transition-colors drop-shadow-xs -mb-0.5"
        >
          Kohi
        </h1>
        <p className="hidden sm:block text-[9px] font-extrabold text-sky-500 dark:text-sky-400 uppercase tracking-[0.16em] mt-1 font-sans">
          COFFEE & PASTRY
        </p>
      </div>
    </div>
  );
};

