import { mcpQuery, mcpListDatabases } from "./mcp-client";

let siriusSuffixes: Record<string, string> | null = null;

async function getSiriusSuffixes(): Promise<Record<string, string>> {
  if (siriusSuffixes) return siriusSuffixes;

  const result = await mcpListDatabases("sirius");
  const dbs: string[] = JSON.parse(result);

  const suffixes: Record<string, string> = {};
  for (const db of dbs) {
    const prefix = db.split("-")[0];
    suffixes[prefix] = db;
  }
  siriusSuffixes = suffixes;
  return suffixes;
}

export interface PropertyDataLake {
  idSeazone: string;
  airbnbListingId: string | null;
  activationDate: string | null;
  propertyMonthly: string;
  competitorsRevenue: string;
  competitorsOccupancy: string;
  performanceDash: string;
  stuckMinPrice: string;
  lastOfferedPrice: string;
  reviews: string;
  detailsRating: string;
  category: string | null;
}

export async function fetchPropertyData(
  idSeazone: string,
  startDate: string,
  endDate: string
): Promise<PropertyDataLake> {
  const db = await getSiriusSuffixes();

  // 1. Airbnb listing ID
  const airbnbResult = await mcpQuery(
    `SELECT code, id_in_ota FROM "${db.saprondata}".listing_otas WHERE code = '${idSeazone}' AND name = 'Airbnb' AND state = 'current' LIMIT 5`,
    "sirius"
  );
  const airbnbMatch = airbnbResult.match(/\n([^,\r]+),(\d+)/);
  const airbnbListingId = airbnbMatch ? airbnbMatch[2] : null;

  // 2. Data de ativação via listing_status
  let activationDate: string | null = null;
  try {
    const statusResult = await mcpQuery(
      `SELECT code, start_date FROM "${db.saprondata}".listing_status WHERE code = '${idSeazone}' AND state = 'current' AND status = 'active' LIMIT 1`,
      "sirius"
    );
    const dateMatch = statusResult.match(/\n[^,]+,(\d{4}-\d{2}-\d{2})/);
    activationDate = dateMatch ? dateMatch[1] : null;
  } catch {
    // silently continue
  }

  // 3. Buscar dados em paralelo
  const [propertyMonthly, competitorsRevenue, competitorsOccupancy, performanceDash, stuckMinPrice, lastOfferedPrice] =
    await Promise.all([
      // Faturamento/ocupação/preço do imóvel
      mcpQuery(
        `SELECT date_trunc('month', dr.date) AS mes,
          SUM(dr.reservation_avg_full_price - dr.reservation_avg_cleaning_fee) AS faturamento_bruto,
          CAST(SUM(CASE WHEN dr.occupied = true THEN 1 ELSE 0 END) AS DOUBLE)
            / NULLIF(COUNT(*) - SUM(CASE WHEN dr.blocked = true THEN 1 ELSE 0 END), 0) AS taxa_ocupacao,
          SUM(CASE WHEN dr.occupied = true THEN 1 ELSE 0 END) AS dias_ocupados,
          SUM(CASE WHEN dr.blocked = true THEN 1 ELSE 0 END) AS dias_bloqueados,
          COUNT(*) AS dias_total,
          AVG(CASE WHEN dr.blocked = false THEN CAST(dr.price AS double) * CASE
            WHEN dr.timestamp < TIMESTAMP '2025-10-22' THEN 1.10
            WHEN dr.timestamp < TIMESTAMP '2025-12-19' THEN 1.17
            ELSE 1.19 END END) AS preco_medio_airbnb
        FROM "${db.revenuedata}".daily_revenue_sapron_active dr
        WHERE dr.listing = '${idSeazone}' AND dr.date BETWEEN DATE '${startDate}' AND DATE '${endDate}'
        GROUP BY date_trunc('month', dr.date) ORDER BY mes LIMIT 24`,
        "sirius"
      ),
      // Faturamento concorrentes
      mcpQuery(
        `WITH mc AS (
          SELECT drc.airbnb_listing_id, date_trunc('month', drc.date) AS mes,
            SUM(drc.day_fat_after_discount) AS sum_revenue
          FROM "${db.competitorsdata}".competitors_plus cp
          JOIN "${db.competitorsdata}".daily_revenue_competitors drc ON cp.airbnb_listing_id = drc.airbnb_listing_id
          WHERE cp.state = 'current' AND cp.listing = '${idSeazone}'
            AND drc.occupied = 'true' AND drc.date BETWEEN DATE '${startDate}' AND DATE '${endDate}'
          GROUP BY drc.airbnb_listing_id, date_trunc('month', drc.date))
        SELECT mes, AVG(sum_revenue) AS fat_medio_concorrentes, COUNT(DISTINCT airbnb_listing_id) AS num_concorrentes
        FROM mc GROUP BY mes ORDER BY mes LIMIT 24`,
        "sirius"
      ),
      // Ocupação/preço concorrentes
      mcpQuery(
        `SELECT date_trunc('month', drc.date) AS mes,
          CAST(SUM(CASE WHEN drc.occupied = 'true' THEN 1 ELSE 0 END) AS DOUBLE)
            / NULLIF(SUM(CASE WHEN drc.occupied = 'true' OR drc.blocked = false THEN 1 ELSE 0 END), 0) AS taxa_ocup_concorrentes,
          AVG(CASE WHEN drc.blocked = false THEN drc.price END) AS preco_medio_concorrentes
        FROM "${db.competitorsdata}".competitors_plus cp
        JOIN "${db.competitorsdata}".daily_revenue_competitors drc ON cp.airbnb_listing_id = drc.airbnb_listing_id
        WHERE cp.state = 'current' AND cp.listing = '${idSeazone}'
          AND drc.date BETWEEN DATE '${startDate}' AND DATE '${endDate}'
        GROUP BY date_trunc('month', drc.date) ORDER BY mes LIMIT 24`,
        "sirius"
      ),
      // Performance dash
      mcpQuery(
        `SELECT listing, year_month, listing_fat, days_occupied, days_blocked, n_competitors,
          meta_value, meta_achieved, group_critic, has_system_price, price_available_avg, category
        FROM \`meta.performance_dash\`
        WHERE listing = '${idSeazone}'
        QUALIFY MAX(timestamp) OVER (PARTITION BY year_month) = timestamp
        ORDER BY year_month DESC LIMIT 12`,
        "gcp"
      ),
      // Pmin
      mcpQuery(
        `SELECT group_or_listing, min_price, start_date, end_date, min_price_origin
        FROM \`infos.stuck_min_price\`
        WHERE group_or_listing = '${idSeazone}'
        ORDER BY start_date DESC LIMIT 20`,
        "gcp"
      ),
      // Último preço enviado
      mcpQuery(
        `SELECT date, price, origin
        FROM "${db.pricingdata}".last_offered_price
        WHERE id_seazone = '${idSeazone}' AND date BETWEEN DATE '${startDate}' AND DATE '${endDate}'
        ORDER BY date DESC LIMIT 60`,
        "sirius"
      ),
    ]);

  // 4. Reviews (se tiver airbnb_listing_id)
  let reviews = "Sem airbnb_listing_id — reviews não disponíveis";
  let detailsRating = "Sem airbnb_listing_id";
  if (airbnbListingId) {
    const now = new Date();
    const year = now.getFullYear().toString();
    const months: string[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      if (d.getFullYear().toString() === year) {
        months.push(`'${d.getMonth() + 1}'`);
      }
    }
    const month = (now.getMonth() + 1).toString();

    [reviews, detailsRating] = await Promise.all([
      mcpQuery(
        `SELECT ano, mes, comment, rating, reviewer_name, date
        FROM brlink_seazone_clean_data.clean_comments
        WHERE airbnb_listing_id = '${airbnbListingId}'
          AND ano = '${year}' AND mes IN (${months.join(",")})
        ORDER BY date DESC LIMIT 20`,
        "lake"
      ),
      mcpQuery(
        `SELECT ano, mes, dia, star_rating, number_of_reviews
        FROM brlink_seazone_clean_data.details
        WHERE airbnb_listing_id = '${airbnbListingId}'
          AND ano = '${year}' AND mes = '${month}'
        ORDER BY CAST(dia AS INTEGER) DESC LIMIT 5`,
        "lake"
      ),
    ]);
  }

  // Extrair categoria do performance_dash
  let category: string | null = null;
  const catMatch = performanceDash.match(/\n[^,]+,[^,]+,[^,]+,[^,]+,[^,]+,[^,]+,[^,]+,[^,]+,[^,]+,[^,]+,[^,]+,([^\r\n]+)/);
  if (catMatch) category = catMatch[1];

  return {
    idSeazone,
    airbnbListingId,
    activationDate,
    propertyMonthly,
    competitorsRevenue,
    competitorsOccupancy,
    performanceDash,
    stuckMinPrice,
    lastOfferedPrice,
    reviews,
    detailsRating,
    category,
  };
}

export function formatDataContext(data: PropertyDataLake): string {
  return `
## DADOS REAIS DO DATA LAKE — ${data.idSeazone}

### Identificação
- Airbnb Listing ID: ${data.airbnbListingId || "Não encontrado"}
- Data de ativação: ${data.activationDate || "Não disponível"}
- Categoria: ${data.category || "Não disponível"}

### Faturamento / Ocupação / Preço Mensal (Imóvel)
${data.propertyMonthly}

### Faturamento Médio Concorrentes (mensal)
${data.competitorsRevenue}

### Ocupação e Preço Médio Concorrentes (mensal)
${data.competitorsOccupancy}

### Performance Dash (GCP — metas, categoria, sistema de preço)
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
