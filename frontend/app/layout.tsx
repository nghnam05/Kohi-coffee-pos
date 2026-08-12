import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Manrope } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className="bg-[#FFFFFF] dark:bg-[#090D16]">
      <head>
        <meta name="theme-color" content="#090D16" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body
        className={`${beVietnamPro.variable} ${manrope.variable} antialiased bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
