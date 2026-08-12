import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/sora/wght.css";
import type { CSSProperties, ReactNode } from "react";
import "./globals.css";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import MobileTabBar from "@/components/site/MobileTabBar";
import { getSchoolSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stmarks-obambo.example.org";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "St Mark's Secondary School – Obambo | Digital Campus",
    template: "%s | St Mark's Secondary School – Obambo",
  },
  description:
    "St Mark's Secondary School – Obambo, located in South West Kisumu Ward, Kisumu West Sub-County, Kisumu County, Kenya. Explore admissions, academics, news, learning resources, student portal, community and alumni network.",
  keywords: [
    "St Mark's Secondary School Obambo",
    "St Marks Obambo Secondary School",
    "St Mark's Secondary School Kisumu",
    "St Marks Obambo contacts",
    "St Marks Obambo admissions",
    "St Marks Obambo learning resources",
  ],
  manifest: "/manifest.json",
  icons: { icon: "/icons/icon.svg" },
  openGraph: {
    type: "website",
    siteName: "St Mark's Secondary School – Obambo",
    title: "St Mark's Secondary School – Obambo | Digital Campus",
    description:
      "The official digital campus of St Mark's Secondary School – Obambo: news, academics, student portal, learning resources, community and alumni network.",
    locale: "en_KE",
  },
  twitter: {
    card: "summary_large_image",
    title: "St Mark's Secondary School – Obambo",
    description: "The official digital campus of St Mark's Secondary School – Obambo, Kisumu County, Kenya.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b6e4f",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSchoolSettings();

  const themeStyle = {
    "--color-primary": settings.primaryColor,
    "--color-secondary": settings.secondaryColor,
    "--color-accent": settings.accentColor,
  } as CSSProperties;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "School",
    name: settings.schoolName,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Obambo, South West Kisumu Ward",
      addressRegion: "Kisumu County",
      addressCountry: "KE",
    },
    description:
      "St Mark's Secondary School – Obambo is a secondary school located in Kisumu West Sub-County, Kisumu County, Kenya.",
  };

  return (
    <html lang="en" style={themeStyle}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          // Apply data-saver preference before paint to avoid flash of heavy content.
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('stmarks-data-saver')==='1'){document.documentElement.classList.add('data-saver')}}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-3 focus:rounded-lg focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        <Header schoolName={settings.schoolName} />
        <main id="main-content" className="min-h-[60vh] pb-16 lg:pb-0">
          {children}
        </main>
        <Footer settings={settings} />
        <MobileTabBar />
      </body>
    </html>
  );
}
