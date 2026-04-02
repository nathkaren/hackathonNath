import { properties, getCompetitors } from "./mock-data";
import { analyzeProperty } from "./analyzer";
import { ANALYSIS_TYPES, PERIOD_LABELS } from "./system-prompt";

/**
 * Gera análise mock em markdown — mesmo formato que o Claude retornaria.
 * Usado como fallback quando a API Anthropic não está disponível.
 */
export function generateMockAnalysis(
  ids: string[],
  tipoAnalise: string,
  periodo: string,
  tom: string,
  contexto?: string
): { analysis: string; foundIds: string[]; notFoundIds: string[] } {
  const foundIds: string[] = [];
  const notFoundIds: string[] = [];
  const sections: string[] = [];

  sections.push(
    `> ⚠️ **Modo demonstração** — Análise gerada com dados simulados. Configure a \`ANTHROPIC_API_KEY\` para análises reais via Claude Sonnet 4.6 + Data Lake Seazone.\n`
  );

  sections.push(
    `**Tipo de análise:** ${ANALYSIS_TYPES[tipoAnalise] || tipoAnalise}  \n` +
    `**Período:** ${PERIOD_LABELS[periodo] || periodo}  \n` +
    `**Tom:** ${tom === "proprietario" ? "Para o proprietário" : "Interno — equipe CS"}` +
    (contexto ? `  \n**Contexto:** ${contexto}` : "")
  );

  for (const id of ids) {
    const property = properties[id];
    if (!property) {
      notFoundIds.push(id);
      continue;
    }
    foundIds.push(id);

    const competitors = getCompetitors(property.id);
    const result = analyzeProperty(property, competitors);

    const compAvgRevenue = Math.round(competitors.reduce((a, b) => a + b.avgRevenue, 0) / competitors.length);
    const compAvgOccupancy = Math.round(competitors.reduce((a, b) => a + b.avgOccupancy, 0) / competitors.length);
    const compAvgDailyRate = Math.round(competitors.reduce((a, b) => a + b.avgDailyRate, 0) / competitors.length);

    // Header do imóvel
    sections.push(`---\n\n## ${property.name} (${property.id})\n`);
    sections.push(
      `📍 ${property.address}  \n` +
      `🏠 Tipo: ${property.type}  \n` +
      `⭐ Nota: ${property.reviewScore}/5.0 (${property.totalReviews} avaliações)\n`
    );

    // Saúde
    const statusEmoji: Record<string, string> = {
      excelente: "🟢", bom: "🔵", "atenção": "🟡", "crítico": "🔴",
    };
    sections.push(`### Saúde do Imóvel\n`);
    sections.push(
      `| Métrica | Score | Status |\n` +
      `|---------|-------|--------|\n` +
      `| **Geral** | **${result.health.overall}/100** | ${statusEmoji[result.health.status]} ${result.health.status.charAt(0).toUpperCase() + result.health.status.slice(1)} |\n` +
      `| Receita | ${result.health.revenue}/100 | |\n` +
      `| Ocupação | ${result.health.occupancy}/100 | |\n` +
      `| Precificação | ${result.health.pricing}/100 | |\n` +
      `| Avaliações | ${result.health.reviews}/100 | |\n`
    );

    // Desempenho mês a mês
    sections.push(`### Desempenho Mensal\n`);
    const lastMonths = Math.min(6, property.months.length);
    const startIdx = property.months.length - lastMonths;

    for (let i = startIdx; i < property.months.length; i++) {
      const month = property.months[i];
      const rev = property.monthlyRevenue[i];
      const occ = property.occupancyRate[i];
      const adr = property.avgDailyRate[i];

      const revDelta = rev - compAvgRevenue;
      const revDeltaPct = ((revDelta / compAvgRevenue) * 100).toFixed(1);
      const occDelta = occ - compAvgOccupancy;
      const adrDelta = adr - compAvgDailyRate;
      const adrDeltaPct = ((adrDelta / compAvgDailyRate) * 100).toFixed(1);

      sections.push(`#### ${month}\n`);
      sections.push(
        `**Faturamento**  \n` +
        `Imóvel: R$ ${rev.toLocaleString("pt-BR")} | Concorrência: R$ ${compAvgRevenue.toLocaleString("pt-BR")}  \n` +
        `Δ: ${revDelta >= 0 ? "+" : ""}R$ ${revDelta.toLocaleString("pt-BR")} | ${revDelta >= 0 ? "+" : ""}${revDeltaPct}%\n`
      );
      sections.push(
        `**Ocupação**  \n` +
        `Imóvel: ${occ}% | Concorrência: ${compAvgOccupancy}%  \n` +
        `Δ: ${occDelta >= 0 ? "+" : ""}${occDelta} p.p.\n`
      );
      sections.push(
        `**Preço Médio Airbnb**  \n` +
        `Imóvel: R$ ${adr} | Concorrência: R$ ${compAvgDailyRate}  \n` +
        `Δ: ${adrDelta >= 0 ? "+" : ""}R$ ${adrDelta} | ${adrDelta >= 0 ? "+" : ""}${adrDeltaPct}%\n`
      );
    }

    // Tabela concorrentes
    sections.push(`### Análise Competitiva\n`);
    sections.push(
      `| Concorrente | Receita Média | Ocupação | Diária Média | Nota |\n` +
      `|-------------|---------------|----------|--------------|------|\n`
    );
    for (const c of competitors) {
      sections.push(
        `| ${c.name} | R$ ${c.avgRevenue.toLocaleString("pt-BR")} | ${c.avgOccupancy}% | R$ ${c.avgDailyRate} | ${c.reviewScore} |\n`
      );
    }
    sections.push(
      `| **Média mercado** | **R$ ${compAvgRevenue.toLocaleString("pt-BR")}** | **${compAvgOccupancy}%** | **R$ ${compAvgDailyRate}** | **${(competitors.reduce((a, b) => a + b.reviewScore, 0) / competitors.length).toFixed(1)}** |\n` +
      `| **${property.name}** | **R$ ${result.performanceSummary.avgRevenue.toLocaleString("pt-BR")}** | **${result.performanceSummary.avgOccupancy}%** | **R$ ${result.performanceSummary.avgDailyRate}** | **${property.reviewScore}** |\n`
    );

    // Plano de ação
    sections.push(`### Plano de Ação\n`);
    const priorityEmoji: Record<string, string> = { alta: "🔴", "média": "🟡", baixa: "🟢" };
    for (const action of result.actions) {
      sections.push(
        `${priorityEmoji[action.priority]} **[${action.priority.toUpperCase()}] ${action.category}**  \n` +
        `${action.action}  \n` +
        `*Impacto esperado: ${action.expectedImpact}*\n`
      );
    }

    // Conclusão
    sections.push(`### Conclusão\n`);
    sections.push(result.conclusion);
  }

  if (notFoundIds.length > 0) {
    sections.push(
      `\n---\n\n⚠️ **IDs não encontrados na base mock:** ${notFoundIds.join(", ")}  \n` +
      `Códigos demo disponíveis: AP001, AP002, AP003, CS001`
    );
  }

  return {
    analysis: sections.join("\n"),
    foundIds,
    notFoundIds,
  };
}
