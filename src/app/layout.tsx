import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pixdrift.com"),
  title: {
    default: "PIXDRIFT",
    template: "%s",
  },
  description: "Ett rum per jobb. Samma inloggning.",
  applicationName: "PIXDRIFT",
  openGraph: {
    type: "website",
    siteName: "PIXDRIFT",
    title: "PIXDRIFT",
    description: "Ett rum per jobb. Samma inloggning.",
    url: "https://pixdrift.com",
  },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
