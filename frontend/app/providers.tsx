'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode, useEffect, useState } from 'react';
import Lenis from 'lenis';

import { Toaster } from 'react-hot-toast';

import { LanguageProvider } from '@/context/LanguageContext';

export function Providers({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          position={isMobile ? 'top-center' : 'top-right'}
          reverseOrder={false}
          gutter={10}
          containerStyle={{
            top: isMobile ? 74 : 24,
            left: isMobile ? 16 : 'auto',
            right: isMobile ? 16 : 24,
            zIndex: 99999,
          }}
          toastOptions={{
            style: {
              background: 'rgba(9, 13, 22, 0.94)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: '400',
              padding: '9px 18px',
              boxShadow: '0 16px 36px -6px rgba(0, 0, 0, 0.7), 0 0 16px rgba(56, 189, 248, 0.15)',
              letterSpacing: '-0.01em',
              maxWidth: isMobile ? 'calc(100vw - 32px)' : '420px',
            },
            success: {
              iconTheme: {
                primary: '#38BDF8',
                secondary: '#090D16',
              },
              style: {
                border: '1px solid rgba(56, 189, 248, 0.45)',
                boxShadow: '0 16px 36px -6px rgba(0, 0, 0, 0.7), 0 0 24px rgba(56, 189, 248, 0.25)',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
              style: {
                border: '1px solid rgba(239, 68, 68, 0.45)',
                boxShadow: '0 16px 36px -6px rgba(0, 0, 0, 0.7), 0 0 24px rgba(239, 68, 68, 0.25)',
              },
            },
            duration: 2500,
          }}
        />
      </NextThemesProvider>
    </LanguageProvider>
  );
}
