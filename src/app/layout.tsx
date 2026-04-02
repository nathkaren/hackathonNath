import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ImóvelInsight - Dashboard de Desempenho",
  description:
    "Análise de desempenho de imóveis com comparação de concorrentes, avaliação de saúde e plano de ação",
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
