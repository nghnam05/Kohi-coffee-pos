'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode, useEffect } from 'react';
import Lenis from 'lenis';

import { Toaster } from 'react-hot-toast';

import { LanguageProvider } from '@/context/LanguageContext';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Only initialize Lenis smooth scroll on non-touch (desktop) devices for peak mobile performance
    const isTouchDevice = typeof window !== 'undefined' && 
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    let lenis: any = null;

    if (!isTouchDevice) {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        prevent: (node: any) => 
          node?.classList?.contains('scrollbar-none') || 
          node?.classList?.contains('scrollbar-thin') || 
          node?.hasAttribute?.('data-lenis-prevent') ||
          Boolean(node?.closest?.('[data-lenis-prevent]')),
      });

      let animationFrameId: number;
      const raf = (time: number) => {
        if (lenis) {
          lenis.raf(time);
          animationFrameId = requestAnimationFrame(raf);
        }
      };

      animationFrameId = requestAnimationFrame(raf);

      return () => {
        if (lenis) lenis.destroy();
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }
  }, []);

  return (
    <LanguageProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            icon: null,
            style: {
              background: '#131929',
              color: '#F1F5F9',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              padding: '10px 16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
            },
            duration: 3500,
          }}
        />
      </NextThemesProvider>
    </LanguageProvider>
  );
}
