import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AnimatedEnergyBackground } from "@/components/animated-energy-background";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Energiakalkulaator",
  applicationName: "Energiakalkulaator",
  description:
    "Päikesejaama, VPP, elektripaketi, EV laadimise ja peak shaving kalkulaatorid ühes kohas. Hinnangud Eesti tingimustes.",
  metadataBase: new URL("https://energiakalkulaator.ee"),
  alternates: {
    canonical: "https://energiakalkulaator.ee",
  },
  icons: {
    icon: [
      { url: "/favicon-ek-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-ek-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-ek-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/logo-ek-1024.png", type: "image/png", sizes: "1024x1024" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon-ek-180.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Energiakalkulaator",
    description:
      "Päikesejaama, VPP, elektripaketi, EV laadimise ja peak shaving kalkulaatorid ühes kohas.",
    url: "https://energiakalkulaator.ee",
    siteName: "Energiakalkulaator",
    locale: "et_EE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Energiakalkulaator",
    description: "Päikesejaama, VPP, elektripaketi, EV laadimise ja peak shaving kalkulaatorid ühes kohas.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <div className="relative page-bg flex-1">
          <AnimatedEnergyBackground intensity="subtle" />
          <div className="relative flex-1">{children}</div>
        </div>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
