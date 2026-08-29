import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { DEFAULT_LOCALE, localeTag, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { COLOR_SCHEME, PAPER_HEX } from "@/lib/platform/theme-chrome";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: PAPER_HEX,
  colorScheme: COLOR_SCHEME,
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await readLocale();
  const description = t(locale, "home.metaDescription");
  return {
    metadataBase: new URL("https://pixdrift.com"),
    title: {
      default: "PIXDRIFT",
      template: "%s",
    },
    description,
    applicationName: "PIXDRIFT",
    openGraph: {
      type: "website",
      siteName: "PIXDRIFT",
    },
    twitter: { card: "summary" },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await readLocale().catch(() => DEFAULT_LOCALE);
  return (
    <html
      lang={localeTag(locale)}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
