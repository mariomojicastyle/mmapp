import type { Metadata } from "next";
import { Prompt, Inter, Arimo } from "next/font/google";
import "./globals.css";

const promptFont = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-prompt",
  display: "swap",
});

const interFont = Inter({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const arimoFont = Arimo({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-arimo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "3BF 3dBimFab",
  description: "Plataforma paramétrica DfMA para la Industria del Mueble RTA.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  manifest: "/site.webmanifest?v=4",
  icons: {
    icon: [
      { url: "/Icon_3BF.png?v=4", sizes: "90x90", type: "image/png" },
      { url: "/icon-192.png?v=4", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=4", sizes: "512x512", type: "image/png" },
      { url: "/Icon_3BF.ico?v=4", type: "image/x-icon" },
      { url: "/favicon.ico?v=4", type: "image/x-icon" },
    ],
    shortcut: "/Icon_3BF.ico?v=4",
    apple: [
      { url: "/icon-192.png?v=4", sizes: "192x192", type: "image/png" },
      { url: "/Icon_3BF.png?v=4", sizes: "90x90", type: "image/png" },
    ],
  },
};

import ThemeManager from "@/components/ui/ThemeManager";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="es" 
      data-theme="tech" 
      className={`${promptFont.variable} ${interFont.variable} ${arimoFont.variable}`}
    >
      <head>
        <link rel="icon" type="image/png" sizes="90x90" href="/Icon_3BF.png?v=4" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=4" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png?v=4" />
        <link rel="icon" type="image/x-icon" href="/Icon_3BF.ico?v=4" />
        <link rel="shortcut icon" href="/Icon_3BF.ico?v=4" />
        <link rel="apple-touch-icon" href="/icon-192.png?v=4" />
        <link rel="manifest" href="/site.webmanifest?v=4" />
        <meta name="theme-color" content="#bb0f0f" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="3dBimFab" />
      </head>
      <body>
        <ThemeManager />
        {children}
      </body>
    </html>
  );
}
