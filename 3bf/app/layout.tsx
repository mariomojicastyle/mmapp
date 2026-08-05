import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3BF Engine — Motor de Manufactura Digital Paramétrica",
  description: "Plataforma paramétrica DfMA para la Industria del Mueble RTA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="tech">
      <body>{children}</body>
    </html>
  );
}
