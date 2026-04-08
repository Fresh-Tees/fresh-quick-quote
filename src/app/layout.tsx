import type { Metadata } from "next";
import { Open_Sans, DM_Sans } from "next/font/google";
import { BrandProvider } from "@/contexts/BrandContext";
import Script from "next/script";
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
  title: "Quick quote | Freshtees",
  description: "Configure garments, print, and finishes—see an indicative estimate and request a quote.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  return (
    <html lang="en" className={`${openSans.variable} ${dmSans.variable} bg-transparent`}>
      <body className="min-h-screen bg-transparent">
        {ga4Id ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga4Id}', { send_page_view: true });
              `}
            </Script>
          </>
        ) : null}
        <BrandProvider>{children}</BrandProvider>
      </body>
    </html>
  );
}
