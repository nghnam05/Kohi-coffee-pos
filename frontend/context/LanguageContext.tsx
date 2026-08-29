'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import viDict from '@/locales/vi.json';
import enDict from '@/locales/en.json';
import zhDict from '@/locales/zh.json';
import { translateText } from '@/utils/translateService';

export type Lang = 'vi' | 'en' | 'zh';

const dictionaries: Record<Lang, Record<string, string>> = {
  vi: viDict as Record<string, string>,
  en: enDict as Record<string, string>,
  zh: zhDict as Record<string, string>,
};

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, fallback?: string) => string;
  translateDynamic: (text: string) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'vi',
  setLang: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  translateDynamic: async (text: string) => text,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>('vi');

  useEffect(() => {
    const saved = localStorage.getItem('pho-beyond-lang') as Lang;
    if (saved && (saved === 'vi' || saved === 'en' || saved === 'zh')) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('pho-beyond-lang', newLang);
  };

  const t = (key: string, fallback?: string): string => {
    const currentDict = dictionaries[lang] || dictionaries.vi;
    return currentDict[key] || fallback || (dictionaries.vi as Record<string, string>)[key] || key;
  };

  const translateDynamic = async (text: string): Promise<string> => {
    return translateText(text, lang, 'vi');
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, translateDynamic }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
