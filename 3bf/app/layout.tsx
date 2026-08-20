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
  icons: {
    icon: [
      { url: "/icon.png?v=2", type: "image/png" },
      { url: "/Icon_MM.ico?v=2", type: "image/x-icon" },
    ],
    shortcut: "/Icon_MM.ico?v=2",
    apple: "/icon.png?v=2",
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
        <link rel="icon" type="image/png" href="/icon.png?v=2" />
        <link rel="icon" type="image/x-icon" href="/Icon_MM.ico?v=2" />
        <link rel="shortcut icon" href="/Icon_MM.ico?v=2" />
      </head>
      <body>
        <ThemeManager />
        {children}
      </body>
    </html>
  );
}
