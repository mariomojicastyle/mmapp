import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3BF Engine — Motor de Manufactura Digital Paramétrica",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="tech">
      <head>
        <link rel="icon" type="image/png" href="/icon.png?v=2" />
        <link rel="icon" type="image/x-icon" href="/Icon_MM.ico?v=2" />
        <link rel="shortcut icon" href="/Icon_MM.ico?v=2" />
      </head>
      <body>{children}</body>
    </html>
  );
}
