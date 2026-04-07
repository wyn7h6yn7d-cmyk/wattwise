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
    "Päikesejaama, VPP, elektripaketi, EV laadimise ja peak shaving kalkulaatorid ühes kohas. Hinnangud Eesti tingimustes.",
  metadataBase: new URL("https://energiakalkulaator.ee"),
  alternates: {
    canonical: "https://energiakalkulaator.ee",
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "48x48" },
    ],
    shortcut: "/icon.png",
    apple: [{ url: "/icon.png", sizes: "180x180" }],
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
