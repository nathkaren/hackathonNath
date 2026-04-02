// Sufixos dos databases Sirius — obtidos via list_databases(source='sirius')
// Estes são os sufixos atuais. Se mudarem, atualizar aqui ou usar env vars.
const SIRIUS_SUFFIXES = {
  competitorsdata: process.env.SIRIUS_COMPETITORSDATA || "competitorsdata-ytphkan8jhr0",
  inputdata: process.env.SIRIUS_INPUTDATA || "inputdata-kdatqapgmwx1",
  pricingdata: process.env.SIRIUS_PRICINGDATA || "pricingdata-pzprucbusfet",
  revenuedata: process.env.SIRIUS_REVENUEDATA || "revenuedata-ljkritvzunqm",
  saprondata: process.env.SIRIUS_SAPRONDATA || "saprondata-9dkamzx2grjg",
};

export { SIRIUS_SUFFIXES };

// Gera a query de airbnb_listing_id a partir do id_seazone
export function queryAirbnbListingId(idSeazone: string): string {
  return `SELECT code, id_in_ota
FROM "${SIRIUS_SUFFIXES.saprondata}".listing_otas
WHERE code = '${idSeazone}' AND name = 'Airbnb' AND state = 'current'
LIMIT 5`;
}

// Gera query de faturamento + ocupação + preço mensal do imóvel
export function queryPropertyMonthly(idSeazone: string, months: number = 6): string {
  return `SELECT
  date_trunc('month', dr.date) AS mes,
  SUM(dr.reservation_avg_full_price - dr.reservation_avg_cleaning_fee) AS faturamento_bruto,
  CAST(SUM(CASE WHEN dr.occupied = true THEN 1 ELSE 0 END) AS DOUBLE)
    / NULLIF(COUNT(*) - SUM(CASE WHEN dr.blocked = true THEN 1 ELSE 0 END), 0) AS taxa_ocupacao,
  SUM(CASE WHEN dr.occupied = true THEN 1 ELSE 0 END) AS dias_ocupados,
  SUM(CASE WHEN dr.blocked = true THEN 1 ELSE 0 END) AS dias_bloqueados,
  COUNT(*) AS dias_total,
  AVG(CASE WHEN dr.blocked = false THEN
    CAST(dr.price AS double) * CASE
      WHEN dr.timestamp < TIMESTAMP '2025-10-22' THEN 1.10
      WHEN dr.timestamp < TIMESTAMP '2025-12-19' THEN 1.17
      ELSE 1.19
    END
  END) AS preco_medio_airbnb
FROM "${SIRIUS_SUFFIXES.revenuedata}".daily_revenue_sapron_active dr
WHERE dr.listing = '${idSeazone}'
  AND dr.date >= DATE_ADD('month', -${months}, CURRENT_DATE)
GROUP BY date_trunc('month', dr.date)
ORDER BY mes
LIMIT 12`;
}

// Gera query de faturamento + ocupação + preço dos concorrentes
export function queryCompetitorsMonthly(idSeazone: string, months: number = 6): string {
  return `WITH monthly_competitors AS (
  SELECT drc.airbnb_listing_id,
         date_trunc('month', drc.date) AS mes,
         SUM(drc.day_fat_after_discount) AS sum_revenue
  FROM "${SIRIUS_SUFFIXES.competitorsdata}".competitors_plus cp
  JOIN "${SIRIUS_SUFFIXES.competitorsdata}".daily_revenue_competitors drc
    ON cp.airbnb_listing_id = drc.airbnb_listing_id
  WHERE cp.state = 'current'
    AND cp.listing = '${idSeazone}'
    AND drc.occupied = 'true'
    AND drc.date >= DATE_ADD('month', -${months}, CURRENT_DATE)
  GROUP BY drc.airbnb_listing_id, date_trunc('month', drc.date)
)
SELECT mes,
       AVG(sum_revenue) AS faturamento_medio_concorrentes,
       COUNT(DISTINCT airbnb_listing_id) AS num_concorrentes
FROM monthly_competitors
GROUP BY mes
ORDER BY mes
LIMIT 12`;
}

// Query de ocupação dos concorrentes
export function queryCompetitorsOccupancy(idSeazone: string, months: number = 6): string {
  return `SELECT date_trunc('month', drc.date) AS mes,
  CAST(SUM(CASE WHEN drc.occupied = 'true' THEN 1 ELSE 0 END) AS DOUBLE)
    / NULLIF(SUM(CASE WHEN drc.occupied = 'true' OR drc.blocked = false THEN 1 ELSE 0 END), 0) AS taxa_ocupacao_concorrentes,
  AVG(CASE WHEN drc.blocked = false THEN drc.price END) AS preco_medio_concorrentes
FROM "${SIRIUS_SUFFIXES.competitorsdata}".competitors_plus cp
JOIN "${SIRIUS_SUFFIXES.competitorsdata}".daily_revenue_competitors drc
  ON cp.airbnb_listing_id = drc.airbnb_listing_id
WHERE cp.state = 'current'
  AND cp.listing = '${idSeazone}'
  AND drc.date >= DATE_ADD('month', -${months}, CURRENT_DATE)
GROUP BY date_trunc('month', drc.date)
ORDER BY mes
LIMIT 12`;
}

// Query de performance_dash (GCP)
export function queryPerformanceDash(idSeazone: string): string {
  return `SELECT listing, year_month, listing_fat, days_occupied, days_blocked,
  n_competitors, meta_value, meta_achieved, group_critic,
  has_system_price, price_available_avg, category
FROM \`meta.performance_dash\`
WHERE listing = '${idSeazone}'
QUALIFY MAX(timestamp) OVER (PARTITION BY year_month) = timestamp
ORDER BY year_month DESC
LIMIT 6`;
}

// Query de pmin travado
export function queryStuckMinPrice(idSeazone: string): string {
  return `SELECT group_or_listing, min_price, start_date, end_date, min_price_origin
FROM \`infos.stuck_min_price\`
WHERE group_or_listing = '${idSeazone}'
ORDER BY start_date DESC
LIMIT 20`;
}

// Query de último preço enviado + origem
export function queryLastOfferedPrice(idSeazone: string, months: number = 3): string {
  return `SELECT date, price, origin
FROM "${SIRIUS_SUFFIXES.pricingdata}".last_offered_price
WHERE id_seazone = '${idSeazone}'
  AND date >= DATE_ADD('month', -${months}, CURRENT_DATE)
ORDER BY date DESC
LIMIT 60`;
}

// Query de reviews (precisa do airbnb_listing_id)
export function queryReviews(airbnbListingId: string): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const months = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    if (d.getFullYear().toString() === year) {
      months.push(`'${d.getMonth() + 1}'`);
    }
  }
  return `SELECT ano, mes, comment, rating, reviewer_name, date
FROM brlink_seazone_clean_data.clean_comments
WHERE airbnb_listing_id = '${airbnbListingId}'
  AND ano = '${year}' AND mes IN (${months.join(",")})
ORDER BY date DESC
LIMIT 20`;
}

// Query de nota e número de reviews
export function queryDetailsRating(airbnbListingId: string): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString();
  return `SELECT ano, mes, dia, star_rating, number_of_reviews
FROM brlink_seazone_clean_data.details
WHERE airbnb_listing_id = '${airbnbListingId}'
  AND ano = '${year}' AND mes = '${month}'
ORDER BY CAST(dia AS INTEGER) DESC
LIMIT 5`;
}
