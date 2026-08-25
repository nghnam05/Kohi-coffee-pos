import type { Metadata, Viewport } from "next";
import { Inter, Be_Vietnam_Pro, Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kohi Coffee & Pastry - Order QR",
  description: "QR Order System for Kohi Coffee & Specialty Drinks",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#090D16" },
  ],
};

import { Providers } from "./providers";
import { cn } from "@/lib/utils";

const playfairDisplayHeading = Playfair_Display({ subsets: ['latin'], variable: '--font-heading' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={cn("bg-[#FFFFFF] dark:bg-[#090D16]", "font-sans", inter.variable, playfairDisplayHeading.variable)}>
      <head>
        <meta name="theme-color" content="#090D16" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body
        className={`${inter.variable} ${beVietnamPro.variable} ${manrope.variable} font-sans antialiased bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
