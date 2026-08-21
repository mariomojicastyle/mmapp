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
  title: "3BF Engine — Powered by MARIO MOJICA, Form & Future",
  description: "Plataforma paramétrica DfMA para la Industria del Mueble RTA.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  icons: {
    icon: [
      { url: "/Icon_3BF.png?v=3", type: "image/png" },
      { url: "/Icon_3BF.ico?v=3", type: "image/x-icon" },
      { url: "/favicon.ico?v=3", type: "image/x-icon" },
    ],
    shortcut: "/Icon_3BF.ico?v=3",
    apple: "/Icon_3BF.png?v=3",
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
        <link rel="icon" type="image/png" href="/Icon_3BF.png?v=3" />
        <link rel="icon" type="image/x-icon" href="/Icon_3BF.ico?v=3" />
        <link rel="shortcut icon" href="/Icon_3BF.ico?v=3" />
        <link rel="apple-touch-icon" href="/Icon_3BF.png?v=3" />
      </head>
      <body>
        <ThemeManager />
        {children}
      </body>
    </html>
  );
}
