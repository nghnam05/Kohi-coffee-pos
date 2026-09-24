import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KOHI Coffee & Pastry - Order QR & Booking",
  description: "QR Order & Online Reservation System for KOHI Coffee & Specialty Drinks",
  icons: {
    icon: [
      { url: "/k-monogram.svg", type: "image/svg+xml" },
    ],
    shortcut: "/k-monogram.svg",
    apple: "/k-monogram.svg",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#090D16" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn(
        "font-sans",
        inter.variable,
        manrope.variable,
        outfit.variable
      )}
    >
      <head>
        <link rel="icon" type="image/svg+xml" href="/k-monogram.svg" />
        <link rel="shortcut icon" href="/k-monogram.svg" />
        <link rel="apple-touch-icon" href="/k-monogram.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        <meta name="theme-color" content="#090D16" />
      </head>
      <body
        className={`${inter.variable} ${manrope.variable} ${outfit.variable} font-sans antialiased bg-[#F9FAFB] dark:bg-[#0E121B] text-slate-900 dark:text-[#CBD5E1] min-h-screen transition-colors duration-200`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
