import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/system-prompt";
import { generateMockAnalysis } from "@/lib/mock-analysis";
import { resolvePeriod } from "@/lib/periods";
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
  const airbnbResult = await mcpQuery(queryAirbnbListingId(idSeazone), "sirius");
  const airbnbMatch = airbnbResult.match(/\n([^,]+),(\d+)/);
  const airbnbListingId = airbnbMatch ? airbnbMatch[2] : null;

  const [propertyMonthly, competitorsMonthly, competitorsOccupancy, performanceDash, stuckMinPrice, lastOfferedPrice] =
    await Promise.all([
      mcpQuery(queryPropertyMonthly(idSeazone, months), "sirius"),
      mcpQuery(queryCompetitorsMonthly(idSeazone, months), "sirius"),
      mcpQuery(queryCompetitorsOccupancy(idSeazone, months), "sirius"),
      mcpQuery(queryPerformanceDash(idSeazone), "gcp"),
      mcpQuery(queryStuckMinPrice(idSeazone), "gcp"),
      mcpQuery(queryLastOfferedPrice(idSeazone, months), "sirius"),
    ]);

  let reviews = "Sem airbnb_listing_id — não foi possível buscar reviews";
  let detailsRating = "Sem airbnb_listing_id";
  if (airbnbListingId) {
    [reviews, detailsRating] = await Promise.all([
      mcpQuery(queryReviews(airbnbListingId), "lake"),
      mcpQuery(queryDetailsRating(airbnbListingId), "lake"),
    ]);
  }

  return {
    idSeazone, airbnbListingId, propertyMonthly, competitorsMonthly,
    competitorsOccupancy, performanceDash, stuckMinPrice, lastOfferedPrice,
    reviews, detailsRating,
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

interface AnalyzePayload {
  ids: string[];
  tipo_analise: string;
  periodo: string;
  periodo_label?: string;
  periodo_meses?: string[];
  periodo_start?: string;
  periodo_end?: string;
  periodo_futuro?: boolean;
  contexto?: string;
  tom: string;
}

async function callGemini(payload: AnalyzePayload): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  // Resolver período — usar dados do frontend ou calcular no backend
  const period = payload.periodo_meses?.length
    ? {
        label: payload.periodo_label || payload.periodo,
        months: payload.periodo_meses,
        startDate: payload.periodo_start || "",
        endDate: payload.periodo_end || "",
        includesFuture: payload.periodo_futuro || false,
      }
    : resolvePeriod(payload.periodo);

  const userMessage = buildUserMessage({
    ids: payload.ids,
    tipo_analise: payload.tipo_analise,
    periodo_label: period.label,
    periodo_meses: period.months,
    periodo_start: period.startDate,
    periodo_end: period.endDate,
    periodo_futuro: period.includesFuture,
    contexto: payload.contexto,
    tom: payload.tom,
  });

  // Dados pré-buscados se disponíveis
  const dataContexts: string[] = [];

  if (process.env.DATA_LAKE_FETCH_URL) {
    void fetchDataLake;
    void buildDataContext;
  }

  const contextBlock = dataContexts.length > 0
    ? `\n\n---\n\n# DADOS PRÉ-BUSCADOS DO DATA LAKE\n\n${dataContexts.join("\n\n---\n\n")}`
    : "";

  const result = await model.generateContent(userMessage + contextBlock);
  const response = result.response;
  return response.text();
}

export async function POST(request: NextRequest) {
  try {
    const payload: AnalyzePayload = await request.json();

    if (!payload.ids || payload.ids.length === 0) {
      return NextResponse.json(
        { error: "Informe pelo menos um ID de imóvel" },
        { status: 400 }
      );
    }

    // Resolver período para mock também
    const period = payload.periodo_meses?.length
      ? { label: payload.periodo_label || payload.periodo, months: payload.periodo_meses }
      : resolvePeriod(payload.periodo);

    // Se não há GEMINI_API_KEY, ir direto para mock
    if (!process.env.GEMINI_API_KEY) {
      const mock = generateMockAnalysis(payload.ids, payload.tipo_analise, period.label, payload.tom, payload.contexto);
      return NextResponse.json({ success: true, analysis: mock.analysis, ids: mock.foundIds, mock: true });
    }

    // Tentar API Gemini
    try {
      const analysis = await callGemini(payload);
      return NextResponse.json({ success: true, analysis, ids: payload.ids });
    } catch (apiError: unknown) {
      console.error("Erro na API Gemini — usando fallback mock:", apiError);
      const mock = generateMockAnalysis(payload.ids, payload.tipo_analise, period.label, payload.tom, payload.contexto);
      return NextResponse.json({ success: true, analysis: mock.analysis, ids: mock.foundIds, mock: true });
    }
  } catch (error: unknown) {
    console.error("Erro na análise:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro ao gerar análise", details: message },
      { status: 500 }
    );
  }
}
