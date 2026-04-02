"use client";

import { ActionPlan } from "@/lib/types";
import { AlertTriangle, TrendingUp, Target, ChevronRight, Zap } from "lucide-react";

interface ActionPlanCardProps {
  actions: ActionPlan[];
}

const PRIORITY_CONFIG = {
  alta: {
    label: "Alta",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
    dot: "bg-red-500",
    icon: AlertTriangle,
    iconColor: "text-red-400",
    glow: "shadow-red-500/10",
  },
  média: {
    label: "Média",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    dot: "bg-amber-500",
    icon: TrendingUp,
    iconColor: "text-amber-400",
    glow: "shadow-amber-500/10",
  },
  baixa: {
    label: "Baixa",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    text: "text-green-400",
    dot: "bg-green-500",
    icon: Target,
    iconColor: "text-green-400",
    glow: "shadow-green-500/10",
  },
};

const PRIORITY_ORDER: ActionPlan["priority"][] = ["alta", "média", "baixa"];

function ActionItem({ action, index }: { action: ActionPlan; index: number }) {
  const config = PRIORITY_CONFIG[action.priority];
  const Icon = config.icon;

  return (
    <div
      className={`group relative flex gap-4 p-4 rounded-xl border ${config.border} ${config.bg} hover:brightness-110 transition-all duration-200 cursor-default`}
    >
      {/* Priority Icon */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-[#0a0a0a] border ${config.border}`}>
        <Icon size={16} className={config.iconColor} />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${config.bg} ${config.border} ${config.text}`}
          >
            {config.label} prioridade
          </span>
          <span className="text-xs text-[#52525b] font-medium bg-[#1a1a1a] border border-[#262626] px-2 py-0.5 rounded-full">
            {action.category}
          </span>
        </div>

        <p className="text-sm text-white font-medium leading-snug">{action.action}</p>

        <div className="flex items-start gap-1.5 mt-0.5">
          <Zap size={12} className="text-[#52525b] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#71717a] leading-relaxed">{action.expectedImpact}</p>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight
        size={14}
        className="text-[#3f3f46] flex-shrink-0 self-center group-hover:text-[#71717a] transition-colors"
      />
    </div>
  );
}

function PrioritySection({
  priority,
  actions,
}: {
  priority: ActionPlan["priority"];
  actions: ActionPlan[];
}) {
  if (actions.length === 0) return null;
  const config = PRIORITY_CONFIG[priority];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        <p className={`text-xs font-semibold uppercase tracking-wider ${config.text}`}>
          {config.label} Prioridade — {actions.length}{" "}
          {actions.length === 1 ? "ação" : "ações"}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {actions.map((action, i) => (
          <ActionItem key={i} action={action} index={i} />
        ))}
      </div>
    </div>
  );
}

export function ActionPlanCard({ actions }: ActionPlanCardProps) {
  const grouped = PRIORITY_ORDER.reduce(
    (acc, priority) => ({
      ...acc,
      [priority]: actions.filter((a) => a.priority === priority),
    }),
    {} as Record<ActionPlan["priority"], ActionPlan[]>
  );

  const totalHigh = grouped["alta"].length;
  const totalMedium = grouped["média"].length;
  const totalLow = grouped["baixa"].length;

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#262626]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Plano de Ação</h2>
            <p className="text-xs text-[#71717a] mt-0.5">
              {actions.length} ações recomendadas para melhorar seu desempenho
            </p>
          </div>
          {/* Summary Badges */}
          <div className="flex items-center gap-2">
            {totalHigh > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                {totalHigh} alta
              </span>
            )}
            {totalMedium > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                {totalMedium} média
              </span>
            )}
            {totalLow > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                {totalLow} baixa
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-5 flex flex-col gap-6">
        {PRIORITY_ORDER.map((priority) => (
          <PrioritySection
            key={priority}
            priority={priority}
            actions={grouped[priority]}
          />
        ))}
      </div>
    </div>
  );
}
