import { PropertyData, CompetitorData, HealthScore, ActionPlan, AnalysisResult } from "./types";

function calculateHealth(property: PropertyData, competitors: CompetitorData[]): HealthScore {
  const avgRevenue = property.monthlyRevenue.reduce((a, b) => a + b, 0) / property.monthlyRevenue.length;
  const avgOccupancy = property.occupancyRate.reduce((a, b) => a + b, 0) / property.occupancyRate.length;
  const avgDailyRate = property.avgDailyRate.reduce((a, b) => a + b, 0) / property.avgDailyRate.length;

  const compAvgRevenue = competitors.reduce((a, b) => a + b.avgRevenue, 0) / competitors.length;
  const compAvgOccupancy = competitors.reduce((a, b) => a + b.avgOccupancy, 0) / competitors.length;
  const compAvgDailyRate = competitors.reduce((a, b) => a + b.avgDailyRate, 0) / competitors.length;
  const compAvgReview = competitors.reduce((a, b) => a + b.reviewScore, 0) / competitors.length;

  const revenueScore = Math.min(100, Math.round((avgRevenue / compAvgRevenue) * 100));
  const occupancyScore = Math.min(100, Math.round((avgOccupancy / compAvgOccupancy) * 100));
  const pricingScore = Math.min(100, Math.round((avgDailyRate / compAvgDailyRate) * 100));
  const reviewScore = Math.min(100, Math.round((property.reviewScore / compAvgReview) * 100));

  const overall = Math.round((revenueScore * 0.35 + occupancyScore * 0.25 + pricingScore * 0.2 + reviewScore * 0.2));

  let status: HealthScore["status"];
  if (overall >= 90) status = "excelente";
  else if (overall >= 75) status = "bom";
  else if (overall >= 60) status = "atenção";
  else status = "crítico";

  return { overall, revenue: revenueScore, occupancy: occupancyScore, pricing: pricingScore, reviews: reviewScore, status };
}

function generateActions(property: PropertyData, competitors: CompetitorData[], health: HealthScore): ActionPlan[] {
  const actions: ActionPlan[] = [];

  if (health.occupancy < 80) {
    actions.push({
      priority: "alta",
      category: "Ocupação",
      action: "Implementar preços dinâmicos para períodos de baixa demanda, oferecendo descontos de 15-20% para estadias de 3+ noites",
      expectedImpact: `Aumento estimado de ${Math.round((80 - health.occupancy) * 0.6)}% na taxa de ocupação`,
    });
  }

  if (health.revenue < 85) {
    actions.push({
      priority: "alta",
      category: "Receita",
      action: "Otimizar listing com fotos profissionais, descrição detalhada e destaque de diferenciais vs concorrentes",
      expectedImpact: "Aumento de 10-15% na taxa de conversão de visualizações em reservas",
    });
  }

  if (health.pricing < 90) {
    actions.push({
      priority: "média",
      category: "Precificação",
      action: "Ajustar diária com base na análise de mercado - considerar aumento gradual de 5-8% nos períodos de alta demanda",
      expectedImpact: "Potencial de R$ 500-1.500 adicionais por mês",
    });
  }

  if (health.reviews < 95) {
    actions.push({
      priority: "média",
      category: "Avaliações",
      action: "Implementar protocolo de check-in/check-out com mensagem personalizada e solicitar avaliação pós-estadia",
      expectedImpact: "Melhoria de 0.2-0.3 pontos na nota média em 3 meses",
    });
  }

  const lastThreeRevenue = property.monthlyRevenue.slice(-3);
  const firstThreeRevenue = property.monthlyRevenue.slice(0, 3);
  const recentAvg = lastThreeRevenue.reduce((a, b) => a + b, 0) / 3;
  const earlyAvg = firstThreeRevenue.reduce((a, b) => a + b, 0) / 3;

  if (recentAvg > earlyAvg * 1.1) {
    actions.push({
      priority: "baixa",
      category: "Expansão",
      action: "Considerar expansão do portfólio na mesma região, aproveitando a tendência de crescimento identificada",
      expectedImpact: "Potencial de dobrar receita com economia de escala operacional",
    });
  }

  actions.push({
    priority: "baixa",
    category: "Marketing",
    action: "Diversificar canais de distribuição (Airbnb, Booking, VRBO) para reduzir dependência de uma única plataforma",
    expectedImpact: "Aumento de 5-10% na visibilidade e redução de comissões médias",
  });

  return actions;
}

function generateConclusion(property: PropertyData, health: HealthScore, competitors: CompetitorData[]): string {
  const avgRevenue = property.monthlyRevenue.reduce((a, b) => a + b, 0) / property.monthlyRevenue.length;
  const compAvgRevenue = competitors.reduce((a, b) => a + b.avgRevenue, 0) / competitors.length;
  const diff = ((avgRevenue - compAvgRevenue) / compAvgRevenue * 100).toFixed(1);

  const trend = property.monthlyRevenue[11] > property.monthlyRevenue[0] ? "ascendente" : "descendente";

  let conclusion = `O imóvel "${property.name}" (${property.id}) apresenta saúde ${health.status} com score geral de ${health.overall}/100. `;

  if (parseFloat(diff) > 0) {
    conclusion += `A receita está ${diff}% acima da média dos concorrentes, indicando boa competitividade. `;
  } else {
    conclusion += `A receita está ${Math.abs(parseFloat(diff))}% abaixo da média dos concorrentes, sinalizando oportunidade de melhoria. `;
  }

  conclusion += `A tendência dos últimos 12 meses é ${trend}, `;

  if (trend === "ascendente") {
    conclusion += `o que demonstra uma gestão eficiente e crescimento sustentável. `;
  } else {
    conclusion += `o que requer atenção imediata para reverter o cenário. `;
  }

  conclusion += `Com nota ${property.reviewScore}/5.0 baseada em ${property.totalReviews} avaliações, `;

  if (property.reviewScore >= 4.5) {
    conclusion += `o imóvel tem excelente reputação, sendo um diferencial competitivo forte. `;
  } else if (property.reviewScore >= 4.0) {
    conclusion += `o imóvel tem boa reputação, mas há espaço para melhorias na experiência do hóspede. `;
  } else {
    conclusion += `a reputação precisa de atenção urgente para não impactar reservas futuras. `;
  }

  conclusion += `Recomenda-se priorizar as ações de ${health.occupancy < health.revenue ? "ocupação" : "receita"} para maximizar o retorno no curto prazo.`;

  return conclusion;
}

export function analyzeProperty(property: PropertyData, competitors: CompetitorData[]): AnalysisResult {
  const health = calculateHealth(property, competitors);
  const actions = generateActions(property, competitors, health);
  const conclusion = generateConclusion(property, health, competitors);

  const avgRevenue = Math.round(property.monthlyRevenue.reduce((a, b) => a + b, 0) / property.monthlyRevenue.length);
  const avgOccupancy = Math.round(property.occupancyRate.reduce((a, b) => a + b, 0) / property.occupancyRate.length);
  const avgDailyRate = Math.round(property.avgDailyRate.reduce((a, b) => a + b, 0) / property.avgDailyRate.length);

  const revenueGrowth = Math.round(
    ((property.monthlyRevenue[11] - property.monthlyRevenue[0]) / property.monthlyRevenue[0]) * 100
  );

  const compAvgRevenue = competitors.reduce((a, b) => a + b.avgRevenue, 0) / competitors.length;
  const marketPosition = avgRevenue >= compAvgRevenue ? "Acima da média" : "Abaixo da média";

  return {
    property,
    competitors,
    health,
    actions,
    conclusion,
    performanceSummary: { avgRevenue, avgOccupancy, avgDailyRate, revenueGrowth, marketPosition },
  };
}
