"use client";

import { useState } from "react";
import { Search, Building2, Loader2, Copy, ClipboardCheck } from "lucide-react";
import { AnalysisRenderer } from "@/components/AnalysisRenderer";

export default function Home() {
  const [ids, setIds] = useState("");
  const [tipoAnalise, setTipoAnalise] = useState("desempenho");
  const [periodo, setPeriodo] = useState("ultimos_6_meses");
  const [tom, setTom] = useState("interno");
  const [contexto, setContexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [analyzedIds, setAnalyzedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleAnalyze() {
    if (!ids.trim()) return;

    setLoading(true);
    setAnalysis("");
    setError("");
    setCopied(false);

    const parsedIds = ids
      .split(",")
      .map((id) => id.trim().toUpperCase())
      .filter(Boolean);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: parsedIds,
          tipo_analise: tipoAnalise,
          periodo,
          tom,
          contexto: contexto || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
        setAnalyzedIds(data.ids);
      } else {
        setError(data.error + (data.details ? `: ${data.details}` : ""));
      }
    } catch (err) {
      setError(`Erro de conexão: ${err instanceof Error ? err.message : "desconhecido"}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(analysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
              Seazone<span className="text-blue-400">Analysis</span>
            </h1>
            <p className="text-xs text-[#737373] leading-none mt-0.5">
              Plataforma de Análise de Imóveis
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Form Card */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-1">
              Nova Análise
            </h2>
            <p className="text-sm text-[#737373]">
              Preencha os dados para gerar a análise via Data Lake Seazone
            </p>
          </div>

          <div className="space-y-5">
            {/* ID(s) do Imóvel */}
            <div>
              <label className="block text-sm font-medium text-[#a3a3a3] mb-2">
                ID(s) do Imóvel
              </label>
              <input
                type="text"
                value={ids}
                onChange={(e) => setIds(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                placeholder="Ex: BVA0303 ou BVA0303, TCO0611, MJA0060"
                className="w-full bg-[#0d0d0d] border border-[#333333] rounded-xl px-4 py-3 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
              <p className="mt-1.5 text-xs text-[#525252]">
                Separe múltiplos IDs por vírgula
              </p>
            </div>

            {/* Row: Tipo + Período + Tom */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-2">
                  Tipo de Análise
                </label>
                <select
                  value={tipoAnalise}
                  onChange={(e) => setTipoAnalise(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-[#333333] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none"
                >
                  <option value="desempenho">Análise de Desempenho</option>
                  <option value="retorno_proprietario">Retorno ao Proprietário</option>
                  <option value="churn">Retenção / Pedido de Churn</option>
                  <option value="relatorio_ocupacao">Relatório de Ocupação</option>
                  <option value="precificacao">Avaliação de Precificação</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-2">
                  Período
                </label>
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-[#333333] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none"
                >
                  <option value="ultimos_3_meses">Últimos 3 meses</option>
                  <option value="ultimos_6_meses">Últimos 6 meses</option>
                  <option value="2025">Ano 2025 completo</option>
                  <option value="2026">2026 até o momento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a3a3a3] mb-2">
                  Tom
                </label>
                <select
                  value={tom}
                  onChange={(e) => setTom(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-[#333333] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none"
                >
                  <option value="interno">Interno (equipe CS)</option>
                  <option value="proprietario">Para o proprietário</option>
                </select>
              </div>
            </div>

            {/* Contexto */}
            <div>
              <label className="block text-sm font-medium text-[#a3a3a3] mb-2">
                Contexto adicional{" "}
                <span className="text-[#525252] font-normal">(opcional)</span>
              </label>
              <textarea
                value={contexto}
                onChange={(e) => setContexto(e.target.value)}
                placeholder="Ex: Proprietário insatisfeito com ocupação em março. Última reserva em 18/02..."
                rows={3}
                className="w-full bg-[#0d0d0d] border border-[#333333] rounded-xl px-4 py-3 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end pt-1">
              <button
                onClick={handleAnalyze}
                disabled={loading || !ids.trim()}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/40 disabled:cursor-not-allowed text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando análise...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Gerar Análise
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#262626]" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Consultando Data Lake e gerando análise...</p>
              <p className="text-sm text-[#737373] mt-1">
                Isso pode levar até 30 segundos
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
            <p className="text-sm font-medium text-red-400 mb-1">Erro na análise</p>
            <p className="text-sm text-[#a3a3a3]">{error}</p>
          </div>
        )}

        {/* Analysis Result */}
        {!loading && analysis && (
          <div className="bg-[#141414] border border-[#262626] rounded-2xl shadow-xl animate-fade-in">
            <div className="flex items-center justify-between px-8 py-5 border-b border-[#262626]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Análise — {analyzedIds.join(", ")}
                  </h2>
                  <p className="text-xs text-[#525252]">
                    Gerado via Claude Sonnet 4.6 + Data Lake Seazone
                  </p>
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 text-xs font-medium text-[#a3a3a3] hover:text-white bg-[#1f1f1f] border border-[#333333] hover:border-[#444444] px-4 py-2 rounded-lg transition-all"
              >
                {copied ? (
                  <>
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <div className="px-8 py-6">
              <AnalysisRenderer content={analysis} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !analysis && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center">
              <Search className="w-9 h-9 text-[#404040]" />
            </div>
            <div>
              <p className="text-[#737373] font-medium">
                Nenhuma análise realizada ainda
              </p>
              <p className="text-sm text-[#525252] mt-1">
                Insira o ID Seazone do imóvel e clique em{" "}
                <span className="text-blue-400">Gerar Análise</span>
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#1a1a1a] mt-16 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-[#404040]">
          Seazone Analysis &mdash; Plataforma interna de análise de desempenho de imóveis
        </div>
      </footer>
    </div>
  );
}
