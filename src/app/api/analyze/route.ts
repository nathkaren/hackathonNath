import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/system-prompt";
import { generateMockAnalysis } from "@/lib/mock-analysis";
import { resolvePeriod } from "@/lib/periods";
import { fetchPropertyData, formatDataContext } from "@/lib/fetch-property";

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

function resolvePeriodFromPayload(payload: AnalyzePayload) {
  if (payload.periodo_meses?.length) {
    return {
      label: payload.periodo_label || payload.periodo,
      months: payload.periodo_meses,
      startDate: payload.periodo_start || "",
      endDate: payload.periodo_end || "",
      includesFuture: payload.periodo_futuro || false,
    };
  }
  const p = resolvePeriod(payload.periodo);
  return {
    label: p.label,
    months: p.months,
    startDate: p.startDate,
    endDate: p.endDate,
    includesFuture: p.includesFuture,
  };
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

    const period = resolvePeriodFromPayload(payload);

    // Se não há GEMINI_API_KEY, ir direto para mock
    if (!process.env.GEMINI_API_KEY) {
      const mock = generateMockAnalysis(payload.ids, payload.tipo_analise, period.label, payload.tom, payload.contexto);
      return NextResponse.json({ success: true, analysis: mock.analysis, ids: mock.foundIds, mock: true });
    }

    // Se tem MCP token, buscar dados reais do Data Lake
    const hasMcp = !!process.env.MCP_DATA_LAKE_TOKEN;
    const dataContexts: string[] = [];

    if (hasMcp) {
      try {
        for (const id of payload.ids) {
          const data = await fetchPropertyData(id.trim().toUpperCase(), period.startDate, period.endDate);
          dataContexts.push(formatDataContext(data));
        }
      } catch (mcpError) {
        console.error("Erro ao buscar dados do Data Lake:", mcpError);
        // Continua sem dados — Gemini vai analisar sem contexto real
      }
    }

    const contextBlock = dataContexts.length > 0
      ? `\n\n---\n\n# DADOS REAIS DO DATA LAKE SEAZONE\nOs dados abaixo foram consultados diretamente do Data Lake. Use APENAS estes dados para a análise — NÃO invente números.\n\n${dataContexts.join("\n\n---\n\n")}`
      : "\n\nATENÇÃO: Não foi possível acessar o Data Lake. Informe ao usuário que os dados reais não estão disponíveis e que a análise não pode ser gerada sem dados.";

    // Montar mensagem
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

    // Chamar Gemini
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await model.generateContent(userMessage + contextBlock);
      const analysis = result.response.text();

      return NextResponse.json({ success: true, analysis, ids: payload.ids, realData: hasMcp && dataContexts.length > 0 });
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
