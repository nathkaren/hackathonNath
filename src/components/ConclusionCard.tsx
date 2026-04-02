"use client";

import { AnalysisResult } from "@/lib/types";
import { DollarSign, Home, TrendingUp, BarChart2, Award, ArrowUp, ArrowDown } from "lucide-react";

interface ConclusionCardProps {
  conclusion: string;
  request?: string;
  performanceSummary?: AnalysisResult["performanceSummary"];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatGrowth(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

const MARKET_POSITION_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; text: string }
> = {
  líder: {
    label: "Líder de Mercado",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
  },
  acima: {
    label: "Acima da Média",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
  },
  médio: {
    label: "Na Média do Mercado",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
  },
  abaixo: {
    label: "Abaixo da Média",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
  },
};

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  trend?: number;
}

function KpiCard({ label, value, sub, icon, accent, trend }: KpiCardProps) {
  return (
    <div className="relative flex flex-col gap-3 p-4 rounded-xl bg-[#0f0f0f] border border-[#262626] overflow-hidden group hover:border-[#3f3f46] transition-colors duration-200">
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
        style={{ background: `radial-gradient(circle at 20% 20%, ${accent}08 0%, transparent 70%)` }}
      />
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accent}15` }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium ${
              trend >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {trend >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xl font-bold text-white tracking-tight leading-none">
          {value}
        </span>
        {sub && <span className="text-xs text-[#52525b]">{sub}</span>}
      </div>
      <span className="text-xs font-medium text-[#71717a]">{label}</span>
    </div>
  );
}

function MarketPositionBadge({ position }: { position: string }) {
  const config =
    MARKET_POSITION_CONFIG[position.toLowerCase()] ?? MARKET_POSITION_CONFIG["médio"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${config.bg} ${config.border} ${config.text}`}
    >
      <Award size={12} />
      {config.label}
    </span>
  );
}

function ConclusionText({ text }: { text: string }) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return (
    <div className="flex flex-col gap-2">
      {sentences.map((sentence, i) => (
        <p key={i} className="text-sm text-[#a1a1aa] leading-relaxed">
          {sentence}
        </p>
      ))}
    </div>
  );
}

export function ConclusionCard({ conclusion, request, performanceSummary }: ConclusionCardProps) {
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#262626]">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-white">Resumo de Desempenho</h2>
            <p className="text-xs text-[#71717a] mt-0.5">
              Visão consolidada dos principais indicadores
            </p>
          </div>
          {performanceSummary && (
            <MarketPositionBadge position={performanceSummary.marketPosition} />
          )}
        </div>
      </div>

      {/* KPI Grid — só renderiza se performanceSummary estiver disponível */}
      {performanceSummary && (
        <>
          <div className="px-6 pt-5 pb-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="Receita Média Mensal"
              value={formatCurrency(performanceSummary.avgRevenue)}
              icon={<DollarSign size={16} />}
              accent="#3b82f6"
            />
            <KpiCard
              label="Taxa de Ocupação"
              value={formatPercent(performanceSummary.avgOccupancy)}
              sub="média do período"
              icon={<Home size={16} />}
              accent="#8b5cf6"
            />
            <KpiCard
              label="Diária Média"
              value={formatCurrency(performanceSummary.avgDailyRate)}
              sub="por noite"
              icon={<BarChart2 size={16} />}
              accent="#f59e0b"
            />
            <KpiCard
              label="Crescimento de Receita"
              value={formatGrowth(performanceSummary.revenueGrowth)}
              sub="vs. período anterior"
              icon={<TrendingUp size={16} />}
              accent={performanceSummary.revenueGrowth >= 0 ? "#22c55e" : "#ef4444"}
              trend={performanceSummary.revenueGrowth}
            />
          </div>
          <div className="mx-6 mt-4 border-t border-[#1f1f1f]" />
        </>
      )}

      {/* Request context */}
      {request && (
        <div className="px-6 pt-5 pb-0 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-[#3f3f46]" />
            <p className="text-xs font-semibold text-[#52525b] uppercase tracking-wider">
              Solicitação
            </p>
          </div>
          <p className="text-xs text-[#52525b] bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 leading-relaxed">
            {request}
          </p>
        </div>
      )}

      {/* Conclusion */}
      <div className="px-6 py-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-blue-500" />
          <p className="text-xs font-semibold text-[#71717a] uppercase tracking-wider">
            Análise e Conclusão
          </p>
        </div>
        <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-4">
          <ConclusionText text={conclusion} />
        </div>
      </div>
    </div>
  );
}
