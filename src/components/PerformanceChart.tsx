"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { AnalysisResult } from "@/lib/types";

interface PerformanceChartProps {
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
  return `${value.toFixed(0)}%`;
}

const TOOLTIP_STYLE = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #262626",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
};

const CustomRevenueTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={TOOLTIP_STYLE} className="px-3 py-2 shadow-xl">
        <p className="text-[#71717a] text-xs mb-1">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[#a1a1aa] text-xs">{entry.name}:</span>
            <span className="text-white font-semibold text-xs">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomOccupancyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={TOOLTIP_STYLE} className="px-3 py-2 shadow-xl">
        <p className="text-[#71717a] text-xs mb-1">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[#a1a1aa] text-xs">{entry.name}:</span>
            <span className="text-white font-semibold text-xs">
              {formatPercent(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function PerformanceChart({ result }: PerformanceChartProps) {
  const { property, competitors } = result;

  const competitorAvgRevenue =
    competitors.length > 0
      ? competitors.reduce((sum, c) => sum + c.avgRevenue, 0) / competitors.length
      : 0;

  const competitorAvgOccupancy =
    competitors.length > 0
      ? competitors.reduce((sum, c) => sum + c.avgOccupancy, 0) / competitors.length
      : 0;

  const revenueData = property.months.map((month, i) => ({
    month,
    imóvel: property.monthlyRevenue[i] ?? 0,
    concorrentes: Math.round(competitorAvgRevenue),
  }));

  const occupancyData = property.months.map((month, i) => ({
    month,
    imóvel: property.occupancyRate[i] ?? 0,
    mercado: Math.round(competitorAvgOccupancy),
  }));

  const axisStyle = { fill: "#71717a", fontSize: 11 };

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-white">Desempenho Histórico</h2>
        <p className="text-xs text-[#71717a] mt-0.5">
          Evolução mensal comparada à média dos concorrentes
        </p>
      </div>

      {/* Revenue Chart */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#a1a1aa]">Receita Mensal</p>
          <div className="flex items-center gap-4">
            <LegendDot color="#3b82f6" label="Seu imóvel" />
            <LegendDot color="#f59e0b" label="Média concorrentes" dashed />
          </div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis
                dataKey="month"
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                width={48}
              />
              <Tooltip content={<CustomRevenueTooltip />} />
              <Line
                type="monotone"
                dataKey="imóvel"
                name="Seu imóvel"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#1d4ed8" }}
              />
              <Line
                type="monotone"
                dataKey="concorrentes"
                name="Média concorrentes"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 4, fill: "#f59e0b" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Occupancy Chart */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#a1a1aa]">Taxa de Ocupação (%)</p>
          <div className="flex items-center gap-4">
            <LegendDot color="#3b82f6" label="Seu imóvel" />
            <LegendDot color="#f59e0b" label="Média mercado" />
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={occupancyData}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis
                dataKey="month"
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
                width={36}
              />
              <Tooltip content={<CustomOccupancyTooltip />} />
              <ReferenceLine
                y={competitorAvgOccupancy}
                stroke="#f59e0b"
                strokeDasharray="5 3"
                strokeWidth={1.5}
              />
              <Bar
                dataKey="imóvel"
                name="Seu imóvel"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="mercado"
                name="Média mercado"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function LegendDot({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {dashed ? (
        <svg width="16" height="8">
          <line
            x1="0"
            y1="4"
            x2="16"
            y2="4"
            stroke={color}
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        </svg>
      ) : (
        <span
          className="inline-block w-3 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="text-xs text-[#71717a]">{label}</span>
    </div>
  );
}
