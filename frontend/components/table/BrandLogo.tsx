'use client';

import React, { useId } from 'react';

interface BrandLogoProps {
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const KOHI_LOGO_URL = '/k-monogram.svg';

/**
 * Custom-designed minimalist vector "K" monogram for KOHI COFFEE & PASTRY.
 * Inspired by Japanese artisan coffee aesthetics (% Arabica / Blue Bottle):
 * Clean geometric lines, subtle natural depth, zero neon glow clutter.
 */
export const KohiKMonogram: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const stemId = `kStem_${safeId}`;
  const upperId = `kUpper_${safeId}`;
  const lowerId = `kLower_${safeId}`;

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="KOHI Monogram K"
    >
      <defs>
        {/* Left vertical pillar: Ocean Blue to Deep Indigo */}
        <linearGradient id={stemId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Upper diagonal arm: Crisp Porcelain White to Skyblue */}
        <linearGradient id={upperId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>

        {/* Lower diagonal arm: Skyblue to Deep Marine Blue */}
        <linearGradient id={lowerId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
      </defs>

      {/* Left Pillar */}
      <rect x="5.5" y="5" width="6" height="26" rx="3" fill={`url(#${stemId})`} />

      {/* Upper Blade */}
      <path
        d="M14.5 18.5 L24.8 6.5 C25.7 5.5 27.3 5.6 28.2 6.6 C29 7.6 28.9 9.1 27.9 10.1 L18.2 21.5 Z"
        fill={`url(#${upperId})`}
      />

      {/* Lower Leg */}
      <path
        d="M14 15.5 L25 29.5 C25.9 30.6 27.5 30.7 28.5 29.7 C29.5 28.7 29.4 27.1 28.3 26 L18.2 13 Z"
        fill={`url(#${lowerId})`}
      />
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  onClick,
  className = '',
  size = 'md',
  showText = true,
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl p-[1px]',
    md: 'w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl p-[1.5px]',
    lg: 'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl p-[2px]',
  };

  const innerRadiusClasses = {
    sm: 'rounded-[7px] sm:rounded-[11px] p-1',
    md: 'rounded-[10px] sm:rounded-[14px] p-1 sm:p-1.5',
    lg: 'rounded-[14px] p-2',
  };

  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 cursor-pointer select-none group shrink-0 transition-transform active:scale-[0.98] ${className}`}
      onClick={onClick}
    >
      {/* Matte Artisan Squircle Emblem */}
      <div
        className={`relative ${sizeClasses[size]} bg-slate-900 dark:bg-[#121622] border border-slate-700/60 dark:border-white/15 shadow-xs flex-shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:border-sky-400/50`}
      >
        <div
          className={`w-full h-full ${innerRadiusClasses[size]} overflow-hidden bg-[#090D16] flex items-center justify-center border border-white/5`}
        >
          <KohiKMonogram className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span
            style={{ fontFamily: 'var(--font-outfit), var(--font-inter), system-ui, sans-serif' }}
            className="text-base sm:text-[21px] font-extrabold text-slate-900 dark:text-white tracking-[0.15em] sm:tracking-[0.18em] uppercase group-hover:text-[#0284C7] dark:group-hover:text-[#38BDF8] transition-colors duration-200"
          >
            KOHI
          </span>
          <span
            style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
            className="block text-[7px] sm:text-[8.5px] font-bold text-slate-500 dark:text-sky-400/90 uppercase tracking-[0.24em] sm:tracking-[0.28em] mt-0.5 sm:mt-1 whitespace-nowrap"
          >
            COFFEE & PASTRY
          </span>
        </div>
      )}
    </div>
  );
};
