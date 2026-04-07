import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
  description:
    "Päikesejaama, VPP, elektripaketi, EV laadimise ja peak shaving kalkulaatorid ühes kohas. Arvuta tasuvus, sääst ja rahavoog Eesti tingimustes.",
  metadataBase: new URL("https://energiakalkulaator.ee"),
  alternates: {
    canonical: "https://energiakalkulaator.ee",
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    shortcut: "/icon",
    apple: "/icon",
  },
  openGraph: {
    title: "Energiakalkulaator",
    description:
      "Arvuta energiaotsuste tasuvus targemalt. Päikesejaama, VPP, elektripaketi, EV laadimise ja peak shaving kalkulaatorid ühes kohas.",
    url: "https://energiakalkulaator.ee",
    siteName: "Energiakalkulaator",
    locale: "et_EE",
    type: "website",
  },
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
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
