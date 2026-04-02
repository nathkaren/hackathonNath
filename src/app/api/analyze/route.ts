import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/system-prompt";
import {
  queryAirbnbListingId,
  queryPropertyMonthly,
  queryCompetitorsMonthly,
  queryCompetitorsOccupancy,
  queryPerformanceDash,
  queryStuckMinPrice,
  queryLastOfferedPrice,
  queryReviews,
  queryDetailsRating,
} from "@/lib/datalake";

const client = new Anthropic();

// Período em meses conforme seleção do usuário
const PERIOD_MONTHS: Record<string, number> = {
  ultimos_3_meses: 3,
  ultimos_6_meses: 6,
  "2025": 15, // cobre jan/2025 até agora
  "2026": 4,  // cobre jan/2026 até agora
};

interface DataLakeResult {
  idSeazone: string;
  airbnbListingId: string | null;
  propertyMonthly: string;
  competitorsMonthly: string;
  competitorsOccupancy: string;
  performanceDash: string;
  stuckMinPrice: string;
  lastOfferedPrice: string;
  reviews: string;
  detailsRating: string;
}

async function fetchDataLake(
  idSeazone: string,
  months: number,
  mcpQuery: (sql: string, source: string) => Promise<string>
): Promise<DataLakeResult> {
  // 1. Obter airbnb_listing_id
  const airbnbResult = await mcpQuery(queryAirbnbListingId(idSeazone), "sirius");
  const airbnbMatch = airbnbResult.match(/\n([^,]+),(\d+)/);
  const airbnbListingId = airbnbMatch ? airbnbMatch[2] : null;

  // 2. Buscar dados em paralelo
  const [propertyMonthly, competitorsMonthly, competitorsOccupancy, performanceDash, stuckMinPrice, lastOfferedPrice] =
    await Promise.all([
      mcpQuery(queryPropertyMonthly(idSeazone, months), "sirius"),
      mcpQuery(queryCompetitorsMonthly(idSeazone, months), "sirius"),
      mcpQuery(queryCompetitorsOccupancy(idSeazone, months), "sirius"),
      mcpQuery(queryPerformanceDash(idSeazone), "gcp"),
      mcpQuery(queryStuckMinPrice(idSeazone), "gcp"),
      mcpQuery(queryLastOfferedPrice(idSeazone, months), "sirius"),
    ]);

  // 3. Reviews (só se tiver airbnb_listing_id)
  let reviews = "Sem airbnb_listing_id — não foi possível buscar reviews";
  let detailsRating = "Sem airbnb_listing_id";
  if (airbnbListingId) {
    [reviews, detailsRating] = await Promise.all([
      mcpQuery(queryReviews(airbnbListingId), "lake"),
      mcpQuery(queryDetailsRating(airbnbListingId), "lake"),
    ]);
  }

  return {
    idSeazone,
    airbnbListingId,
    propertyMonthly,
    competitorsMonthly,
    competitorsOccupancy,
    performanceDash,
    stuckMinPrice,
    lastOfferedPrice,
    reviews,
    detailsRating,
  };
}

function buildDataContext(data: DataLakeResult): string {
  return `
## DADOS DO DATA LAKE — ${data.idSeazone}

### Airbnb Listing ID
${data.airbnbListingId || "Não encontrado"}

### Faturamento / Ocupação / Preço Mensal (Imóvel)
${data.propertyMonthly}

### Faturamento Médio Concorrentes (mensal)
${data.competitorsMonthly}

### Ocupação e Preço Médio Concorrentes (mensal)
${data.competitorsOccupancy}

### Performance Dash (GCP)
${data.performanceDash}

### Histórico de Pmin
${data.stuckMinPrice}

### Último Preço Enviado + Origem
${data.lastOfferedPrice}

### Reviews Recentes
${data.reviews}

### Nota e Número de Reviews
${data.detailsRating}
`.trim();
}

export async function POST(request: NextRequest) {
  try {
    const { ids, tipo_analise, periodo, contexto, tom } = await request.json();

    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { error: "Informe pelo menos um ID de imóvel" },
        { status: 400 }
      );
    }

    const months = PERIOD_MONTHS[periodo] || 6;
    const userMessage = buildUserMessage({ ids, tipo_analise, periodo, contexto, tom });

    // Se MCP_DATA_LAKE_URL estiver configurado, usar Claude com MCP direto
    if (process.env.MCP_DATA_LAKE_URL) {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });

      const analysis = response.content
        .filter((block) => block.type === "text")
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("\n");

      return NextResponse.json({ success: true, analysis, ids });
    }

    // Fallback: chamar Claude sem MCP, com dados pré-buscados no contexto
    // Quando DATA_LAKE_FETCH_URL estiver configurado, buscar dados primeiro
    // Por enquanto, enviar sem dados pré-buscados (Claude responderá com base no prompt)
    const dataContexts: string[] = [];

    if (process.env.DATA_LAKE_FETCH_URL) {
      // Futuro: integração direta com o Data Lake via API própria
      // const mcpQuery = async (sql: string, source: string) => { ... };
      // for (const id of ids) {
      //   const data = await fetchDataLake(id, months, mcpQuery);
      //   dataContexts.push(buildDataContext(data));
      // }
    }

    const contextBlock = dataContexts.length > 0
      ? `\n\n---\n\n# DADOS PRÉ-BUSCADOS DO DATA LAKE\n\n${dataContexts.join("\n\n---\n\n")}`
      : "";

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userMessage + contextBlock,
        },
      ],
    });

    const analysis = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n");

    return NextResponse.json({ success: true, analysis, ids });
  } catch (error: unknown) {
    console.error("Erro na análise:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro ao gerar análise", details: message },
      { status: 500 }
    );
  }
}
