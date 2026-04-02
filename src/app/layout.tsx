import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seazone Analysis — Análise de Imóveis",
  description:
    "Plataforma interna de análise de desempenho de imóveis via Data Lake Seazone",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
