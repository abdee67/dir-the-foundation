import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { DM_Sans, Playfair_Display, Inter, Noto_Sans_Bengali } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { env } from '@/lib/env'
import {
  BRAND_APPLE_TOUCH_ICON_URL,
  BRAND_FAVICON_16_URL,
  BRAND_FAVICON_32_URL,
  BRAND_FAVICON_URL,
  DEFAULT_BRAND_LOGO_URL,
} from '@/lib/brand'
import { NavigationProgress } from '@/components/navigation-progress'
import { GoogleAnalytics } from "@next/third-parties/google"
import { Analytics } from '@vercel/analytics/react';

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-primary",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  display: "swap",
  variable: "--font-bengali",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: {
    default: 'DIR (ድር) THE FOUNDATION',
    template: '%s · DIR (ድር) THE FOUNDATION',
  },
  description: "DIR (ድር) THE FOUNDATION — Premium Fashion Retail",
  applicationName: 'DIR (ድር) THE FOUNDATION',
  keywords: ['DIR', 'DIR Foundation', 'Ethiopian fashion', 'premium clothing', 'clothing store', 'Addis Ababa fashion'],
  category: 'fashion',
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: BRAND_FAVICON_URL, type: 'image/x-icon' },
      { url: BRAND_FAVICON_16_URL, type: 'image/png', sizes: '16x16' },
      { url: BRAND_FAVICON_32_URL, type: 'image/png', sizes: '32x32' },
    ],
    shortcut: [BRAND_FAVICON_URL],
    apple: [{ url: BRAND_APPLE_TOUCH_ICON_URL, type: 'image/png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_ET',
    siteName: 'DIR (ድር) THE FOUNDATION',
    title: 'DIR (ድር) THE FOUNDATION',
    description: 'Considered fashion for everyday life.',
    images: [{ url: DEFAULT_BRAND_LOGO_URL, width: 512, height: 512, alt: 'DIR (ድር) THE FOUNDATION logo' }],
  },
  twitter: {
    card: 'summary',
    title: 'DIR (ድር) THE FOUNDATION',
    description: 'Considered fashion for everyday life.',
    images: [DEFAULT_BRAND_LOGO_URL],
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${playfair.variable} ${inter.variable} ${notoSansBengali.variable} font-sans antialiased`}
      >
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
      <GoogleAnalytics gaId={process.env.GOOGLE_ANALYTICS_ID ?? ''} />
    </html>
  );
}
