"use client";

import { AnalysisResult } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CompetitorTableProps {
  result: AnalysisResult;
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

function DeltaBadge({ value, reference }: { value: number; reference: number }) {
  const diff = ((value - reference) / reference) * 100;
  const isAbove = diff > 1;
  const isBelow = diff < -1;

  if (isAbove) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-400">
        <TrendingUp size={11} />
        {diff.toFixed(0)}%
      </span>
    );
  }
  if (isBelow) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-400">
        <TrendingDown size={11} />
        {Math.abs(diff).toFixed(0)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[#71717a]">
      <Minus size={11} />
      0%
    </span>
  );
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-amber-400 text-xs">★</span>
      <span className="text-sm text-white font-medium">{score.toFixed(1)}</span>
    </div>
  );
}

function CompareCell({
  value,
  reference,
  format,
}: {
  value: number;
  reference: number;
  format: (v: number) => string;
}) {
  const diff = value - reference;
  const isAbove = diff > reference * 0.01;
  const isBelow = diff < -reference * 0.01;

  return (
    <td className="px-4 py-3 text-sm">
      <span
        className={
          isAbove
            ? "text-green-400 font-medium"
            : isBelow
            ? "text-red-400 font-medium"
            : "text-[#a1a1aa]"
        }
      >
        {format(value)}
      </span>
    </td>
  );
}

export function CompetitorTable({ result }: CompetitorTableProps) {
  const { property, competitors } = result;

  const propertyAvgRevenue =
    property.monthlyRevenue.reduce((a, b) => a + b, 0) / property.monthlyRevenue.length;
  const propertyAvgOccupancy =
    property.occupancyRate.reduce((a, b) => a + b, 0) / property.occupancyRate.length;
  const propertyAvgDailyRate =
    property.avgDailyRate.reduce((a, b) => a + b, 0) / property.avgDailyRate.length;

  const marketAvgRevenue =
    competitors.reduce((sum, c) => sum + c.avgRevenue, 0) / competitors.length;
  const marketAvgOccupancy =
    competitors.reduce((sum, c) => sum + c.avgOccupancy, 0) / competitors.length;
  const marketAvgDailyRate =
    competitors.reduce((sum, c) => sum + c.avgDailyRate, 0) / competitors.length;
  const marketAvgReview =
    competitors.reduce((sum, c) => sum + c.reviewScore, 0) / competitors.length;

  const columns = ["Imóvel", "Receita Média", "Ocupação", "Diária Média", "Avaliação"];

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#262626]">
        <h2 className="text-base font-semibold text-white">Análise Competitiva</h2>
        <p className="text-xs text-[#71717a] mt-0.5">
          Comparativo com {competitors.length} concorrentes na região
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#262626]">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-[#71717a] uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {/* Property Row */}
            <tr className="bg-blue-500/5 border-l-2 border-l-blue-500">
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">{property.name}</span>
                  <span className="text-xs text-blue-400 mt-0.5">Seu imóvel</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-white">
                    {formatCurrency(propertyAvgRevenue)}
                  </span>
                  <DeltaBadge value={propertyAvgRevenue} reference={marketAvgRevenue} />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-white">
                    {formatPercent(propertyAvgOccupancy)}
                  </span>
                  <DeltaBadge value={propertyAvgOccupancy} reference={marketAvgOccupancy} />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-white">
                    {formatCurrency(propertyAvgDailyRate)}
                  </span>
                  <DeltaBadge value={propertyAvgDailyRate} reference={marketAvgDailyRate} />
                </div>
              </td>
              <td className="px-4 py-3">
                <StarRating score={property.reviewScore} />
                <span className="text-xs text-[#71717a]">
                  {property.totalReviews} avaliações
                </span>
              </td>
            </tr>

            {/* Competitors */}
            {competitors.map((competitor) => (
              <tr
                key={competitor.id}
                className="hover:bg-[#1a1a1a] transition-colors duration-150"
              >
                <td className="px-4 py-3">
                  <span className="text-sm text-[#a1a1aa]">{competitor.name}</span>
                </td>
                <CompareCell
                  value={competitor.avgRevenue}
                  reference={propertyAvgRevenue}
                  format={formatCurrency}
                />
                <CompareCell
                  value={competitor.avgOccupancy}
                  reference={propertyAvgOccupancy}
                  format={formatPercent}
                />
                <CompareCell
                  value={competitor.avgDailyRate}
                  reference={propertyAvgDailyRate}
                  format={formatCurrency}
                />
                <td className="px-4 py-3">
                  <StarRating score={competitor.reviewScore} />
                </td>
              </tr>
            ))}

            {/* Market Average Row */}
            <tr className="bg-[#1a1a1a] border-t border-[#262626]">
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#a1a1aa]">
                    Média do Mercado
                  </span>
                  <span className="text-xs text-[#52525b] mt-0.5">
                    {competitors.length} concorrentes
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-medium text-[#a1a1aa]">
                  {formatCurrency(marketAvgRevenue)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-medium text-[#a1a1aa]">
                  {formatPercent(marketAvgOccupancy)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-medium text-[#a1a1aa]">
                  {formatCurrency(marketAvgDailyRate)}
                </span>
              </td>
              <td className="px-4 py-3">
                <StarRating score={marketAvgReview} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-[#262626] flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={12} className="text-green-400" />
          <span className="text-xs text-[#71717a]">Acima do seu imóvel</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown size={12} className="text-red-400" />
          <span className="text-xs text-[#71717a]">Abaixo do seu imóvel</span>
        </div>
      </div>
    </div>
  );
}
