'use client';

import React from 'react';

interface BrandLogoProps {
  onClick?: () => void;
}

export const KOHI_LOGO_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1gruMY9y7itKwQuGt_2QDbG7uIA1qTve1u9WDH-CKJQLM7F9Qw9vRxSl4_HMI9_XsWuqEjaaVZSAaPCY7-_dWlbtAlWBQYk5BLoONpBRYW0pLgjKwf23nU1P6ZZM8OUvEe5PSiGxng65S3Hx4-XKmnbmvKq_do2HYm5AMqKiZaGelzC3KCfS-B2K26AjAtskxfDHcLLp7PUjGLV50mFJkLVGR-yoiMk0qUd-ikHaWqjyOlCCKQC7Xmw';

export const BrandLogo: React.FC<BrandLogoProps> = ({ onClick }) => {
  return (
    <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onClick}>
      <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#E2E8F0] dark:border-[#222732] shadow-sm bg-[#FFFFFF] dark:bg-[#181B21] flex items-center justify-center flex-shrink-0">
        <img
          alt="Kohi Coffee Logo"
          className="w-full h-full object-cover"
          src={KOHI_LOGO_URL}
        />
      </div>
      <div>
        <h1 className="text-lg font-[800] text-[#000000] dark:text-[#FFFFFF] tracking-tight leading-none font-heading">
          Kohi
        </h1>
        <p className="text-[9.5px] font-[700] text-[#38BDF8] uppercase tracking-[0.05em] mt-1 font-sans">
          COFFEE & PASTRY
        </p>
      </div>
    </div>
  );
};
