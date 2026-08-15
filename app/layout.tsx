import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intelia · Estado de proyecto",
  description: "Portal de proyectos de Intelia para clientes",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
