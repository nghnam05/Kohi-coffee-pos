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
              background: 'rgba(19, 25, 41, 0.94)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: '800',
              padding: '12px 20px',
              boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.15)',
              letterSpacing: '-0.01em',
            },
            success: {
              style: {
                border: '1px solid rgba(52, 211, 153, 0.5)',
                boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.6), 0 0 24px rgba(52, 211, 153, 0.2)',
              },
            },
            error: {
              style: {
                border: '1px solid rgba(251, 113, 133, 0.5)',
                boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.6), 0 0 24px rgba(251, 113, 133, 0.2)',
              },
            },
            duration: 3500,
          }}
        />
      </NextThemesProvider>
    </LanguageProvider>
  );
}
