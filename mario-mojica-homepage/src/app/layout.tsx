import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";
import UmamiIgnoreManager from "@/components/UmamiIgnoreManager";

export const metadata: Metadata = {
  metadataBase: new URL("https://mariomojica.com"),
  title: "Software para Manufactura de Muebles | Mario Mojica - Industria 4.0",
  description: "Firma de desarrollo de software especializado para la industria de la manufactura de muebles (RTA, planeados, modulados, tapizados y personalizados). Escalamos tus procesos de fabricación e impulsamos la experiencia del cliente.",
  keywords: [
    "Software para manufactura de muebles",
    "Desarrollo de software industrial",
    "Software para fábricas de muebles",
    "Muebles RTA",
    "Muebles planeados",
    "Muebles modulados",
    "Muebles tapizados",
    "Industria 4.0 muebles",
    "Manuales 3D interactivos",
    "Smart manufacturing furniture"
  ],
  openGraph: {
    title: "Software para Manufactura de Muebles | Mario Mojica",
    description: "Desarrollamos software para la manufactura de muebles. Escalamos tus procesos de fabricación y creamos para tus clientes una experiencia memorable desde la compra hasta el uso.",
    url: "https://mariomojica.com",
    siteName: "Mario Mojica - Software para Manufactura",
    images: [
      {
        url: "https://mariomojica.com/og-image.webp",
        width: 1200,
        height: 630,
        alt: "Mario Mojica - Software para Manufactura de Muebles",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Software para Manufactura de Muebles | Mario Mojica",
    description: "Desarrollamos software para la manufactura de muebles. Escalamos tus procesos de fabricación y creamos para tus clientes una experiencia memorable desde la compra hasta el uso.",
    images: ["https://mariomojica.com/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Mario Mojica - Software para Manufactura de Muebles",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Desarrollo de software especializado para la industria de la manufactura de muebles (RTA, planeados, modulados, tapizados y personalizados). Soluciones de asistencia 3D por voz, automatización e Industria 4.0.",
  "author": {
    "@type": "Organization",
    "name": "Mario Mojica",
    "url": "https://mariomojica.com"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full scroll-smooth dark">
      <head>
        <meta property="fb:app_id" content="1736322840851405" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js" async></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            src="https://analytics.mariomojica.com/script.js"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <UmamiIgnoreManager />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
