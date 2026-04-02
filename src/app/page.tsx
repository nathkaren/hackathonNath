"use client";

import { useState } from "react";
import { Search, Building2, Loader2 } from "lucide-react";
import { HealthGauge } from "@/components/HealthGauge";
import { PerformanceChart } from "@/components/PerformanceChart";
import { CompetitorTable } from "@/components/CompetitorTable";
import { ActionPlanCard } from "@/components/ActionPlanCard";
import { ConclusionCard } from "@/components/ConclusionCard";
import { properties, getCompetitors } from "@/lib/mock-data";
import { analyzeProperty } from "@/lib/analyzer";
import { AnalysisResult } from "@/lib/types";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  studio: "Studio",
  cobertura: "Cobertura",
};

export default function Home() {
  const [codes, setCodes] = useState("");
  const [request, setRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  async function handleAnalyze() {
    if (!codes.trim()) return;

    setLoading(true);
    setResults([]);
    setErrors([]);
    setHasAnalyzed(false);

    await new Promise((r) => setTimeout(r, 1500));

    const parsedCodes = codes
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    const newResults: AnalysisResult[] = [];
    const newErrors: string[] = [];

    for (const code of parsedCodes) {
      const property = properties[code];
      if (property) {
        const competitors = getCompetitors(property.id);
        newResults.push(analyzeProperty(property, competitors));
      } else {
        newErrors.push(code);
      }
    }

    setResults(newResults);
    setErrors(newErrors);
    setHasAnalyzed(true);
    setLoading(false);
  }

  const statusColor: Record<string, string> = {
    excelente: "text-emerald-400",
    bom: "text-blue-400",
    "atenção": "text-amber-400",
    "crítico": "text-red-400",
  };

  const statusBg: Record<string, string> = {
    excelente: "bg-emerald-400/10 border-emerald-400/30",
    bom: "bg-blue-400/10 border-blue-400/30",
    "atenção": "bg-amber-400/10 border-amber-400/30",
    "crítico": "bg-red-400/10 border-red-400/30",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#262626] bg-[#0d0d0d] sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <Building2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Imóvel<span className="text-blue-400">Insight</span>
            </h1>
            <p className="text-xs text-[#737373] leading-none mt-0.5">
              Dashboard de Desempenho de Imóveis
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[#525252] bg-[#141414] border border-[#262626] px-3 py-1 rounded-full">
              Códigos válidos: AP001, AP002, AP003, CS001
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Search Card */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-1">
              Analisar Imóveis
            </h2>
            <p className="text-sm text-[#737373]">
              Insira os códigos dos imóveis e descreva o que deseja analisar
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#a3a3a3] mb-2">
                Código(s) do Imóvel
              </label>
              <input
                type="text"
                value={codes}
                onChange={(e) => setCodes(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                placeholder="Ex: AP001, AP002, CS001"
                className="w-full bg-[#0d0d0d] border border-[#333333] rounded-xl px-4 py-3 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
              <p className="mt-1.5 text-xs text-[#525252]">
                Separe múltiplos códigos com vírgula
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a3a3a3] mb-2">
                Solicitação
              </label>
              <textarea
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder="Ex: Quero entender por que a ocupação caiu no último trimestre e como melhorar a receita mensal..."
                rows={3}
                className="w-full bg-[#0d0d0d] border border-[#333333] rounded-xl px-4 py-3 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-[#525252]">
                A análise inclui saúde geral, comparativos de mercado e plano de ação
              </p>
              <button
                onClick={handleAnalyze}
                disabled={loading || !codes.trim()}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/40 disabled:cursor-not-allowed text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Analisar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#262626]" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Processando análise...</p>
              <p className="text-sm text-[#737373] mt-1">
                Coletando dados e comparando com o mercado
              </p>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {!loading && errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
            <p className="text-sm font-medium text-red-400 mb-1">
              Código(s) não encontrado(s)
            </p>
            <p className="text-sm text-[#a3a3a3]">
              Os seguintes códigos não existem na base de dados:{" "}
              <span className="font-mono font-semibold text-red-300">
                {errors.join(", ")}
              </span>
            </p>
            <p className="text-xs text-[#737373] mt-2">
              Códigos válidos: AP001, AP002, AP003, CS001
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-12">
            {results.map((result, idx) => (
              <section key={result.property.id} className="space-y-6">
                {/* Property Header */}
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-bold text-white">
                          {result.property.name}
                        </h2>
                        <span className="text-xs font-mono bg-[#1f1f1f] border border-[#333333] text-[#a3a3a3] px-2.5 py-1 rounded-lg">
                          {result.property.id}
                        </span>
                        <span className="text-xs bg-[#1f1f1f] border border-[#333333] text-[#a3a3a3] px-2.5 py-1 rounded-lg capitalize">
                          {PROPERTY_TYPE_LABELS[result.property.type] || result.property.type}
                        </span>
                      </div>
                      <p className="text-sm text-[#737373] mt-1">
                        {result.property.address}
                      </p>
                    </div>
                  </div>

                  {/* Health Badge */}
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold capitalize ${
                      statusBg[result.health.status]
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        result.health.status === "excelente"
                          ? "bg-emerald-400"
                          : result.health.status === "bom"
                          ? "bg-blue-400"
                          : result.health.status === "atenção"
                          ? "bg-amber-400"
                          : "bg-red-400"
                      }`}
                    />
                    <span
                      className={statusColor[result.health.status]}
                    >
                      Saúde: {result.health.status.charAt(0).toUpperCase() + result.health.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Receita Média",
                      value: `R$ ${result.performanceSummary.avgRevenue.toLocaleString("pt-BR")}`,
                      sub: "por mês",
                    },
                    {
                      label: "Ocupação Média",
                      value: `${result.performanceSummary.avgOccupancy}%`,
                      sub: "taxa mensal",
                    },
                    {
                      label: "Diária Média",
                      value: `R$ ${result.performanceSummary.avgDailyRate.toLocaleString("pt-BR")}`,
                      sub: "por noite",
                    },
                    {
                      label: "Crescimento",
                      value: `${result.performanceSummary.revenueGrowth > 0 ? "+" : ""}${result.performanceSummary.revenueGrowth}%`,
                      sub: result.performanceSummary.marketPosition,
                      highlight:
                        result.performanceSummary.revenueGrowth > 0
                          ? "text-emerald-400"
                          : "text-red-400",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-[#141414] border border-[#262626] rounded-xl p-4"
                    >
                      <p className="text-xs text-[#737373] mb-1">{stat.label}</p>
                      <p
                        className={`text-xl font-bold ${
                          stat.highlight || "text-white"
                        }`}
                      >
                        {stat.value}
                      </p>
                      <p className="text-xs text-[#525252] mt-0.5">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Charts & Gauge Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1 bg-[#141414] border border-[#262626] rounded-2xl p-6 flex flex-col items-center justify-center">
                    <p className="text-sm font-semibold text-[#a3a3a3] mb-4 self-start">
                      Índice de Saúde
                    </p>
                    <HealthGauge health={result.health} />
                  </div>
                  <div className="lg:col-span-2 bg-[#141414] border border-[#262626] rounded-2xl p-6">
                    <p className="text-sm font-semibold text-[#a3a3a3] mb-4">
                      Desempenho Mensal vs Concorrentes
                    </p>
                    <PerformanceChart result={result} />
                  </div>
                </div>

                {/* Competitor Table */}
                <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                  <p className="text-sm font-semibold text-[#a3a3a3] mb-4">
                    Análise Competitiva
                  </p>
                  <CompetitorTable result={result} />
                </div>

                {/* Action Plan & Conclusion */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                    <ActionPlanCard actions={result.actions} />
                  </div>
                  <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                    <ConclusionCard
                      conclusion={result.conclusion}
                      request={request}
                    />
                  </div>
                </div>

                {/* Divider between multiple results */}
                {idx < results.length - 1 && (
                  <div className="border-t border-[#1f1f1f] pt-4" />
                )}
              </section>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && hasAnalyzed && results.length === 0 && errors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <Building2 className="w-12 h-12 text-[#333333]" />
            <p className="text-[#737373]">Nenhum resultado encontrado.</p>
          </div>
        )}

        {!hasAnalyzed && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center">
              <Search className="w-9 h-9 text-[#404040]" />
            </div>
            <div>
              <p className="text-[#737373] font-medium">
                Nenhuma análise realizada ainda
              </p>
              <p className="text-sm text-[#525252] mt-1">
                Insira um ou mais códigos de imóvel e clique em{" "}
                <span className="text-blue-400">Analisar</span>
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#1a1a1a] mt-16 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-[#404040]">
          ImóvelInsight &mdash; Análise inteligente de desempenho para o mercado de locação por temporada
        </div>
      </footer>
    </div>
  );
}
