'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode, useEffect } from 'react';
import Lenis from 'lenis';

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

      const raf = (time: number) => {
        if (lenis) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
      };

      requestAnimationFrame(raf);
    }

    // Set up Scroll Reveal Intersection Observer for premium entry transitions
    const observerOptions = {
      root: null, // viewport
      rootMargin: '0px 0px -60px 0px', // trigger slightly before entering viewport
      threshold: 0.05, // trigger when 5% visible
    };

    const observer = new IntersectionObserver((entries, observerInstance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          // Optimize DOM: stop observing once transitioned
          observerInstance.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Scan and observe all designated scroll elements (Debounced to prevent layout thrashing)
    let scanTimeout: NodeJS.Timeout | null = null;
    const observeElements = () => {
      if (scanTimeout) clearTimeout(scanTimeout);
      scanTimeout = setTimeout(() => {
        const elements = document.querySelectorAll('.reveal-on-scroll');
        elements.forEach((el) => {
          if (!el.classList.contains('is-revealed')) {
            observer.observe(el);
          }
        });
      }, 80);
    };

    observeElements();

    // Watch dynamic React DOM updates (such as switching tabs, categories, or lazy loaded orders)
    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      if (lenis) lenis.destroy();
      observer.disconnect();
      mutationObserver.disconnect();
      if (scanTimeout) clearTimeout(scanTimeout);
    };
  }, []);

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
