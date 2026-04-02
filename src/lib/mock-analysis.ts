import { properties, getCompetitors } from "./mock-data";
import { analyzeProperty } from "./analyzer";
import { ANALYSIS_TYPES, PERIOD_LABELS } from "./system-prompt";

/**
 * Gera análise mock no formato narrativo Seazone.
 * Usado como fallback quando a API Gemini não está disponível.
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
    `> ⚠️ **Modo demonstração** — Análise gerada com dados simulados. Configure a \`GEMINI_API_KEY\` para análises reais via Gemini + Data Lake Seazone.\n`
  );

  sections.push(
    `**Tipo de análise:** ${ANALYSIS_TYPES[tipoAnalise] || tipoAnalise}  \n` +
    `**Período:** ${PERIOD_LABELS[periodo] || periodo}  \n` +
    `**Tom:** ${tom === "proprietario" ? "Para o proprietário" : "Interno — equipe CS"}` +
    (contexto ? `  \n**Contexto:** ${contexto}` : "") + "\n"
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
    const compAvgReview = (competitors.reduce((a, b) => a + b.reviewScore, 0) / competitors.length).toFixed(1);

    const fmt = (n: number) => n.toLocaleString("pt-BR");
    const pct = (a: number, b: number) => ((a - b) / b * 100).toFixed(1);

    // --- Section 1: Desempenho ---
    sections.push(`---\n\n## 1. Desempenho do imóvel — ${property.name} (${property.id})\n`);
    sections.push(
      `O ${property.name} é um ${property.type} localizado em ${property.address}. ` +
      `Com nota ${property.reviewScore}/5.0 baseada em ${property.totalReviews} avaliações, ` +
      `o imóvel tem ${property.reviewScore >= 4.5 ? "excelente reputação no Airbnb" : "boa reputação, com espaço para melhoria"}. ` +
      `A análise abaixo cobre os últimos 6 meses de operação.\n`
    );

    const lastMonths = Math.min(6, property.months.length);
    const startIdx = property.months.length - lastMonths;

    for (let i = startIdx; i < property.months.length; i++) {
      const month = property.months[i];
      const rev = property.monthlyRevenue[i];
      const occ = property.occupancyRate[i];
      const adr = property.avgDailyRate[i];

      const revDeltaPct = pct(rev, compAvgRevenue);
      const occDelta = occ - compAvgOccupancy;
      const adrDelta = adr - compAvgDailyRate;

      sections.push(`**${month}:**\n`);
      sections.push(
        `- Faturamento: R$ ${fmt(rev)} vs ~R$ ${fmt(compAvgRevenue)} → ${parseFloat(revDeltaPct) >= 0 ? "+" : ""}${revDeltaPct}%\n` +
        `- Ocupação: ${occ}% vs ${compAvgOccupancy}% → ${occDelta >= 0 ? "+" : ""}${occDelta} p.p.${occDelta > 0 ? " ✅" : ""}\n` +
        `- Preço médio: R$ ${adr} vs ~R$ ${compAvgDailyRate} → R$ ${adrDelta >= 0 ? "+" : ""}${adrDelta} ${adrDelta >= 0 ? "acima" : "abaixo"}\n`
      );

      // Narrative explanation
      if (occ >= compAvgOccupancy && rev >= compAvgRevenue) {
        sections.push(
          `- **Explicação:** Mês forte — o imóvel superou a concorrência tanto em ocupação quanto em faturamento. ` +
          `Preço ${adrDelta >= 0 ? "acima" : "abaixo"} do mercado com demanda sólida.\n`
        );
      } else if (occ >= compAvgOccupancy) {
        sections.push(
          `- **Explicação:** Ocupação competitiva${occDelta > 5 ? " e acima do mercado" : ""}, mas o faturamento ficou abaixo — ` +
          `preço médio ${Math.abs(adrDelta)} ${adrDelta < 0 ? "abaixo" : "acima"} da concorrência é o principal fator.\n`
        );
      } else {
        sections.push(
          `- **Explicação:** Ocupação ${Math.abs(occDelta)} p.p. abaixo da concorrência. ` +
          `${adr < compAvgDailyRate ? "Mesmo com preço mais baixo, o imóvel não converteu demanda suficiente — possível gap de visibilidade ou posicionamento." : "Preço acima do mercado pode estar impactando a conversão."}\n`
        );
      }
    }

    // --- Section 2: Análise competitiva (tabela) ---
    sections.push(`\n## 2. Posicionamento competitivo\n`);
    sections.push(
      `| Concorrente | Receita Média | Ocupação | Diária Média | Nota |\n` +
      `|-------------|---------------|----------|--------------|------|\n`
    );
    for (const c of competitors) {
      sections.push(
        `| ${c.name} | R$ ${fmt(c.avgRevenue)} | ${c.avgOccupancy}% | R$ ${c.avgDailyRate} | ${c.reviewScore} |\n`
      );
    }
    sections.push(
      `| **Média mercado** | **R$ ${fmt(compAvgRevenue)}** | **${compAvgOccupancy}%** | **R$ ${compAvgDailyRate}** | **${compAvgReview}** |\n` +
      `| **${property.name}** | **R$ ${fmt(result.performanceSummary.avgRevenue)}** | **${result.performanceSummary.avgOccupancy}%** | **R$ ${result.performanceSummary.avgDailyRate}** | **${property.reviewScore}** |\n`
    );

    const mktPos = result.performanceSummary.avgRevenue >= compAvgRevenue ? "acima" : "abaixo";
    sections.push(
      `\nO imóvel está posicionado **${mktPos} da média de mercado** em receita. ` +
      `${result.performanceSummary.avgOccupancy >= compAvgOccupancy
        ? "A ocupação média está competitiva — bom sinal de demanda."
        : "A ocupação média abaixo da concorrência indica oportunidade de melhoria no posicionamento."}\n`
    );

    // --- Section 3: Pontos positivos ---
    sections.push(`\n## 3. O que os dados mostram de positivo\n`);
    const positives: string[] = [];

    if (property.reviewScore >= 4.5) {
      positives.push(`Nota **${property.reviewScore}/5.0** no Airbnb com **${property.totalReviews} avaliações** — excelente reputação que favorece ranqueamento`);
    } else if (property.reviewScore >= 4.0) {
      positives.push(`Nota **${property.reviewScore}/5.0** com ${property.totalReviews} avaliações — boa base, com potencial de melhoria`);
    }

    // Find best months
    const bestOccIdx = property.occupancyRate.indexOf(Math.max(...property.occupancyRate.slice(startIdx)));
    if (property.occupancyRate[bestOccIdx] > compAvgOccupancy) {
      positives.push(`**${property.months[bestOccIdx]}:** ${property.occupancyRate[bestOccIdx]}% de ocupação — superou a concorrência em +${property.occupancyRate[bestOccIdx] - compAvgOccupancy} p.p.`);
    }

    if (result.performanceSummary.revenueGrowth > 0) {
      positives.push(`Tendência de crescimento: **+${result.performanceSummary.revenueGrowth}%** de evolução no faturamento ao longo do período`);
    }

    if (result.performanceSummary.avgDailyRate >= compAvgDailyRate) {
      positives.push(`Preço médio acima da concorrência (R$ ${result.performanceSummary.avgDailyRate} vs R$ ${compAvgDailyRate}) — indica percepção de valor pelo hóspede`);
    }

    for (const p of positives) {
      sections.push(`- ${p}\n`);
    }

    sections.push(
      `\n${result.performanceSummary.avgOccupancy >= compAvgOccupancy
        ? "A mensagem é clara: **o imóvel tem demanda sólida e converte bem**. O foco deve ser maximizar receita nos períodos de pico."
        : "O imóvel tem fundamentos positivos — **o desafio é converter essa base em ocupação consistente**, especialmente em meses de menor demanda."}\n`
    );

    // --- Section 4: Plano de ação ---
    sections.push(`\n## 4. Plano de ação\n`);

    for (const action of result.actions) {
      sections.push(
        `**${action.category}** — ${action.priority === "alta" ? "ação imediata" : action.priority === "média" ? "curto prazo" : "médio prazo"}\n\n` +
        `${action.action}\n\n` +
        `*Impacto esperado: ${action.expectedImpact}*\n`
      );
    }

    // --- Conclusão ---
    sections.push(`\n## 📌 Conclusão\n`);

    const mainIssue = result.health.occupancy < result.health.revenue ? "ocupação" : "receita";
    sections.push(
      `O ${property.name} (${property.id}) apresenta saúde **${result.health.status}** com score de **${result.health.overall}/100**. ` +
      `${result.conclusion}\n\n` +
      `As duas ações mais impactantes no curto prazo são:\n\n` +
      `1. **${result.actions[0]?.category || "Otimização de listing"}** — ${result.actions[0]?.action.split(",")[0] || "melhorar posicionamento"}\n` +
      `2. **${result.actions[1]?.category || "Precificação"}** — ${result.actions[1]?.action.split(",")[0] || "ajustar estratégia de preço"}\n`
    );
  }

  if (notFoundIds.length > 0) {
    sections.push(
      `\n---\n\n⚠️ **IDs não encontrados na base demo:** ${notFoundIds.join(", ")}  \n` +
      `Códigos disponíveis para demonstração: AP001, AP002, AP003, CS001`
    );
  }

  return {
    analysis: sections.join("\n"),
    foundIds,
    notFoundIds,
  };
}
