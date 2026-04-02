import { NextRequest, NextResponse } from "next/server";
import {
  queryAirbnbListingId,
  queryPropertyMonthly,
  queryCompetitorsMonthly,
  queryCompetitorsOccupancy,
  queryPerformanceDash,
  queryStuckMinPrice,
  queryLastOfferedPrice,
} from "@/lib/datalake";

// Esta rota retorna as queries SQL que seriam executadas no Data Lake.
// Em produção com acesso ao Data Lake, executaria as queries diretamente.
// Por enquanto serve como documentação e debug das queries geradas.

export async function POST(request: NextRequest) {
  try {
    const { ids, periodo } = await request.json();

    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { error: "Informe pelo menos um ID de imóvel" },
        { status: 400 }
      );
    }

    const periodMonths: Record<string, number> = {
      ultimos_3_meses: 3,
      ultimos_6_meses: 6,
      "2025": 15,
      "2026": 4,
    };
    const months = periodMonths[periodo] || 6;

    const results = ids.map((id: string) => {
      const idSeazone = id.trim().toUpperCase();
      return {
        idSeazone,
        queries: {
          airbnb_listing_id: {
            sql: queryAirbnbListingId(idSeazone),
            source: "sirius",
            description: "Buscar Airbnb listing ID do imóvel",
          },
          property_monthly: {
            sql: queryPropertyMonthly(idSeazone, months),
            source: "sirius",
            description: "Faturamento, ocupação e preço mensal do imóvel",
          },
          competitors_monthly: {
            sql: queryCompetitorsMonthly(idSeazone, months),
            source: "sirius",
            description: "Faturamento médio mensal dos concorrentes",
          },
          competitors_occupancy: {
            sql: queryCompetitorsOccupancy(idSeazone, months),
            source: "sirius",
            description: "Ocupação e preço médio dos concorrentes",
          },
          performance_dash: {
            sql: queryPerformanceDash(idSeazone),
            source: "gcp",
            description: "Performance consolidada (metas, categoria, etc)",
          },
          stuck_min_price: {
            sql: queryStuckMinPrice(idSeazone),
            source: "gcp",
            description: "Histórico de preço mínimo travado",
          },
          last_offered_price: {
            sql: queryLastOfferedPrice(idSeazone, months),
            source: "sirius",
            description: "Último preço enviado e origem (sistema vs manual)",
          },
        },
      };
    });

    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro ao gerar queries", details: message },
      { status: 500 }
    );
  }
}
