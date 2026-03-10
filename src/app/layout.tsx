import type { Metadata } from "next";
import { Open_Sans, DM_Sans } from "next/font/google";
import { BrandProvider } from "@/contexts/BrandContext";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-neue-haas",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Get started | Freshtees",
  description: "Tell us what you need—we'll point you in the right direction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${openSans.variable} ${dmSans.variable} bg-transparent`}>
      <body className="min-h-screen bg-transparent">
        <BrandProvider>{children}</BrandProvider>
      </body>
    </html>
  );
}
