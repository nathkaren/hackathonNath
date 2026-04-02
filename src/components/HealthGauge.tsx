"use client";

import { HealthScore } from "@/lib/types";

interface HealthGaugeProps {
  health: HealthScore;
}

const STATUS_CONFIG = {
  excelente: {
    label: "Excelente",
    color: "#22c55e",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
    ring: "#22c55e",
  },
  bom: {
    label: "Bom",
    color: "#3b82f6",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    ring: "#3b82f6",
  },
  "atenção": {
    label: "Atenção",
    color: "#f59e0b",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    ring: "#f59e0b",
  },
  crítico: {
    label: "Crítico",
    color: "#ef4444",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    ring: "#ef4444",
  },
};

const SUB_SCORES = [
  { key: "revenue", label: "Receita" },
  { key: "occupancy", label: "Ocupação" },
  { key: "pricing", label: "Precificação" },
  { key: "reviews", label: "Avaliações" },
] as const;

function CircularGauge({ score, color }: { score: number; color: string }) {
  const radius = 70;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const gap = circumference - progress;
  const size = (radius + strokeWidth) * 2;
  const center = size / 2;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#262626"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${progress} ${gap}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease-in-out", filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
    </svg>
  );
}

function SubScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-[#a1a1aa]">{label}</span>
        <span className="text-xs font-semibold" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#262626] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
        />
      </div>
    </div>
  );
}

function getSubScoreColor(value: number): string {
  if (value >= 80) return "#22c55e";
  if (value >= 60) return "#3b82f6";
  if (value >= 40) return "#f59e0b";
  return "#ef4444";
}

export function HealthGauge({ health }: HealthGaugeProps) {
  const config = STATUS_CONFIG[health.status];

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Health Score</h2>
          <p className="text-xs text-[#71717a] mt-0.5">Índice geral de saúde do imóvel</p>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full border ${config.bg} ${config.border} ${config.text}`}
        >
          {config.label}
        </span>
      </div>

      {/* Gauge + Score */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative flex items-center justify-center">
          <CircularGauge score={health.overall} color={config.color} />
          <div className="absolute flex flex-col items-center">
            <span
              className="text-4xl font-bold tabular-nums leading-none"
              style={{ color: config.color, textShadow: `0 0 20px ${config.color}60` }}
            >
              {health.overall}
            </span>
            <span className="text-xs text-[#71717a] mt-1">de 100</span>
          </div>
        </div>
      </div>

      {/* Sub Scores */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-[#71717a] uppercase tracking-wider">
          Detalhamento
        </p>
        {SUB_SCORES.map(({ key, label }) => (
          <SubScoreBar
            key={key}
            label={label}
            value={health[key]}
            color={getSubScoreColor(health[key])}
          />
        ))}
      </div>
    </div>
  );
}
