/**
 * Lógica de períodos de análise Seazone.
 *
 * Todas as datas são calculadas dinamicamente a partir de new Date().
 * Meses são contínuos, sem buracos, no formato MMM/YY.
 */

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export interface PeriodResult {
  key: string;
  label: string;
  description: string;
  months: string[];          // ["Nov/25", "Dez/25", "Jan/26", ...]
  startDate: string;         // "2025-11-01"
  endDate: string;           // "2026-04-30"
  includesFuture: boolean;
}

function formatMonth(year: number, month: number): string {
  return `${MONTH_NAMES[month]}/${String(year).slice(2)}`;
}

function formatDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Gera lista de meses contínuos entre startYear/startMonth e endYear/endMonth (inclusivo).
 */
function generateMonthRange(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): string[] {
  const months: string[] = [];
  let y = startYear;
  let m = startMonth;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    months.push(formatMonth(y, m));
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return months;
}

/**
 * Calcula os 6 períodos disponíveis.
 * @param activationDate - data de ativação do imóvel (ISO string). Se null, usa 6 meses atrás.
 * @param now - data atual (injetável para testes). Default: new Date().
 */
export function calculatePeriods(activationDate?: string | null, now?: Date): PeriodResult[] {
  const today = now || new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-based

  // Activation date parsing
  let actYear: number;
  let actMonth: number;
  if (activationDate) {
    const d = new Date(activationDate);
    actYear = d.getFullYear();
    actMonth = d.getMonth();
  } else {
    // Fallback: 6 meses atrás
    const fallback = new Date(currentYear, currentMonth - 6, 1);
    actYear = fallback.getFullYear();
    actMonth = fallback.getMonth();
  }

  const periods: PeriodResult[] = [];

  // 1. Desde ativação até mês atual
  {
    const months = generateMonthRange(actYear, actMonth, currentYear, currentMonth);
    periods.push({
      key: "desde_ativacao",
      label: "Desde ativação até hoje",
      description: `${formatMonth(actYear, actMonth)} → ${formatMonth(currentYear, currentMonth)}`,
      months,
      startDate: formatDateISO(actYear, actMonth, 1),
      endDate: formatDateISO(currentYear, currentMonth, lastDayOfMonth(currentYear, currentMonth)),
      includesFuture: false,
    });
  }

  // 2. Desde ativação +1 mês à frente
  {
    const endDate = new Date(currentYear, currentMonth + 1, 1);
    const eY = endDate.getFullYear();
    const eM = endDate.getMonth();
    const months = generateMonthRange(actYear, actMonth, eY, eM);
    periods.push({
      key: "desde_ativacao_plus1",
      label: "Desde ativação +1 mês",
      description: `${formatMonth(actYear, actMonth)} → ${formatMonth(eY, eM)}`,
      months,
      startDate: formatDateISO(actYear, actMonth, 1),
      endDate: formatDateISO(eY, eM, lastDayOfMonth(eY, eM)),
      includesFuture: true,
    });
  }

  // 3. Desde ativação +2 meses à frente
  {
    const endDate = new Date(currentYear, currentMonth + 2, 1);
    const eY = endDate.getFullYear();
    const eM = endDate.getMonth();
    const months = generateMonthRange(actYear, actMonth, eY, eM);
    periods.push({
      key: "desde_ativacao_plus2",
      label: "Desde ativação +2 meses",
      description: `${formatMonth(actYear, actMonth)} → ${formatMonth(eY, eM)}`,
      months,
      startDate: formatDateISO(actYear, actMonth, 1),
      endDate: formatDateISO(eY, eM, lastDayOfMonth(eY, eM)),
      includesFuture: true,
    });
  }

  // 4. Últimos 4 meses + mês atual
  {
    const startDate = new Date(currentYear, currentMonth - 4, 1);
    const sY = startDate.getFullYear();
    const sM = startDate.getMonth();
    const months = generateMonthRange(sY, sM, currentYear, currentMonth);
    periods.push({
      key: "ultimos4_atual",
      label: "Últimos 4 meses + atual",
      description: `${formatMonth(sY, sM)} → ${formatMonth(currentYear, currentMonth)}`,
      months,
      startDate: formatDateISO(sY, sM, 1),
      endDate: formatDateISO(currentYear, currentMonth, lastDayOfMonth(currentYear, currentMonth)),
      includesFuture: false,
    });
  }

  // 5. Últimos 4 meses +1 mês à frente
  {
    const startDate = new Date(currentYear, currentMonth - 4, 1);
    const sY = startDate.getFullYear();
    const sM = startDate.getMonth();
    const endDate = new Date(currentYear, currentMonth + 1, 1);
    const eY = endDate.getFullYear();
    const eM = endDate.getMonth();
    const months = generateMonthRange(sY, sM, eY, eM);
    periods.push({
      key: "ultimos4_plus1",
      label: "Últimos 4 meses +1 à frente",
      description: `${formatMonth(sY, sM)} → ${formatMonth(eY, eM)}`,
      months,
      startDate: formatDateISO(sY, sM, 1),
      endDate: formatDateISO(eY, eM, lastDayOfMonth(eY, eM)),
      includesFuture: true,
    });
  }

  // 6. Últimos 4 meses +2 meses à frente
  {
    const startDate = new Date(currentYear, currentMonth - 4, 1);
    const sY = startDate.getFullYear();
    const sM = startDate.getMonth();
    const endDate = new Date(currentYear, currentMonth + 2, 1);
    const eY = endDate.getFullYear();
    const eM = endDate.getMonth();
    const months = generateMonthRange(sY, sM, eY, eM);
    periods.push({
      key: "ultimos4_plus2",
      label: "Últimos 4 meses +2 à frente",
      description: `${formatMonth(sY, sM)} → ${formatMonth(eY, eM)}`,
      months,
      startDate: formatDateISO(sY, sM, 1),
      endDate: formatDateISO(eY, eM, lastDayOfMonth(eY, eM)),
      includesFuture: true,
    });
  }

  return periods;
}

/**
 * Resolve um período pelo key e retorna o PeriodResult.
 */
export function resolvePeriod(key: string, activationDate?: string | null): PeriodResult {
  const periods = calculatePeriods(activationDate);
  return periods.find((p) => p.key === key) || periods[3]; // default: ultimos4_atual
}
