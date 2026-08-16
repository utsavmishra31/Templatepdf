import type { Metadata, Viewport } from "next";
import { Manrope, Newsreader } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["600"],
});

export const metadata: Metadata = {
  title: "Manual Template Filler",
  description: "Frontend-only Spanish translation DOCX template filler",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/icons/apple-touch-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Template Filler",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${newsreader.variable}`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}