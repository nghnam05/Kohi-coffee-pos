'use client';

import React from 'react';

export type Lang = 'vi' | 'en' | 'zh';

interface LanguageToggleSwitchProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const LanguageToggleSwitch: React.FC<LanguageToggleSwitchProps> = ({ lang, setLang }) => {
  return (
    <div className="bg-[#FFFFFF] dark:bg-[#090D16] border border-[#E2E8F0] dark:border-[#222732] rounded-xl p-1 flex items-center gap-1 shadow-xs">
      <button
        onClick={() => setLang('vi')}
        className={`text-[10.5px] font-[800] px-2.5 py-1 rounded-lg transition-all font-sans ${
          lang === 'vi'
            ? 'bg-[#38BDF8] text-[#FFFFFF] shadow-sm'
            : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
        }`}
      >
        VI
      </button>
      <button
        onClick={() => setLang('en')}
        className={`text-[10.5px] font-[800] px-2.5 py-1 rounded-lg transition-all font-sans ${
          lang === 'en'
            ? 'bg-[#38BDF8] text-[#FFFFFF] shadow-sm'
            : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('zh')}
        className={`text-[10.5px] font-[800] px-2.5 py-1 rounded-lg transition-all font-sans ${
          lang === 'zh'
            ? 'bg-[#38BDF8] text-[#FFFFFF] shadow-sm'
            : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
        }`}
      >
        ZH
      </button>
    </div>
  );
};
