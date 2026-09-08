import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteAtmosphere } from "@/components/site-atmosphere";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CookieConsentManager } from "@/components/legal/CookieConsentManager";
import { ConsentAwareAnalytics } from "@/components/legal/ConsentAwareAnalytics";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — börsihind, PV ja tööstusanalüüs`,
    template: `%s | ${SITE_NAME}`,
  },
  applicationName: SITE_NAME,
  description: SITE_DESCRIPTION,
  keywords: [
    "energiakalkulaator",
    "börsihind",
    "Nord Pool",
    "päikeseenergia",
    "PV",
    "akusalvestus",
    "peak shaving",
    "tööstusenergia",
    "Eesti elekter",
  ],
  authors: [{ name: "Kenneth Alto" }],
  creator: "Kenneth Alto",
  publisher: SITE_NAME,
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Stable favicon URLs for Google Search (square, ≥48px recommended).
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-ek-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-ek-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-ek-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-ek-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-ek-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
    apple: [{ url: "/apple-touch-icon-ek-180.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: `${SITE_NAME} — börsihind, PV ja tööstusanalüüs`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "et_EE",
    type: "website",
    images: [
      {
        url: "/icon-ek-512.png",
        width: 512,
        height: 512,
        alt: `${SITE_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — börsihind, PV ja tööstusanalüüs`,
    description: SITE_DESCRIPTION,
    images: ["/icon-ek-512.png"],
  },
  category: "energy",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
    { media: "(prefers-color-scheme: light)", color: "#0b1220" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="et"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col">
        <SiteAtmosphere />
        <SiteHeader />
        <div className="relative page-bg flex-1">{children}</div>
        <SiteFooter />
        <CookieConsentManager />
        <ConsentAwareAnalytics />
      </body>
    </html>
  );
}
