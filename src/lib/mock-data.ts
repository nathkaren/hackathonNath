import { PropertyData, CompetitorData } from "./types";

const months = [
  "Jul/25", "Ago/25", "Set/25", "Out/25", "Nov/25", "Dez/25",
  "Jan/26", "Fev/26", "Mar/26", "Abr/26", "Mai/26", "Jun/26",
];

export const properties: Record<string, PropertyData> = {
  "AP001": {
    id: "AP001",
    name: "Flat Paulista Premium",
    address: "Av. Paulista, 1000 - São Paulo/SP",
    type: "apartamento",
    monthlyRevenue: [8500, 9200, 7800, 10500, 11200, 14500, 13800, 12000, 9800, 10200, 11500, 12800],
    occupancyRate: [72, 78, 65, 82, 85, 95, 92, 88, 76, 80, 84, 89],
    avgDailyRate: [380, 395, 400, 420, 440, 510, 500, 455, 430, 425, 460, 480],
    reviewScore: 4.6,
    totalReviews: 187,
    months,
  },
  "AP002": {
    id: "AP002",
    name: "Studio Vila Madalena",
    address: "R. Aspicuelta, 250 - São Paulo/SP",
    type: "studio",
    monthlyRevenue: [5200, 5800, 4900, 6200, 6800, 8500, 8200, 7500, 6100, 6500, 7200, 7800],
    occupancyRate: [68, 74, 60, 78, 82, 92, 88, 84, 72, 76, 80, 85],
    avgDailyRate: [250, 260, 270, 265, 275, 310, 305, 295, 280, 285, 300, 305],
    reviewScore: 4.3,
    totalReviews: 95,
    months,
  },
  "AP003": {
    id: "AP003",
    name: "Cobertura Copacabana",
    address: "Av. Atlântica, 500 - Rio de Janeiro/RJ",
    type: "cobertura",
    monthlyRevenue: [15000, 16500, 14200, 18000, 19500, 25000, 24000, 21000, 17500, 18200, 20000, 22000],
    occupancyRate: [65, 70, 58, 75, 80, 98, 95, 90, 73, 76, 82, 88],
    avgDailyRate: [750, 780, 810, 800, 820, 850, 840, 780, 790, 800, 820, 835],
    reviewScore: 4.8,
    totalReviews: 142,
    months,
  },
  "CS001": {
    id: "CS001",
    name: "Casa Jardins Charm",
    address: "R. Oscar Freire, 800 - São Paulo/SP",
    type: "casa",
    monthlyRevenue: [12000, 11500, 10800, 13200, 14000, 16500, 15800, 14200, 12500, 13000, 14500, 15200],
    occupancyRate: [60, 58, 52, 66, 70, 85, 82, 75, 62, 65, 72, 78],
    avgDailyRate: [650, 660, 690, 670, 680, 650, 645, 635, 670, 668, 670, 650],
    reviewScore: 4.1,
    totalReviews: 63,
    months,
  },
};

export function getCompetitors(propertyId: string): CompetitorData[] {
  const competitors: Record<string, CompetitorData[]> = {
    "AP001": [
      { id: "C1", name: "Flat Augusta Center", avgRevenue: 10800, avgOccupancy: 80, avgDailyRate: 420, reviewScore: 4.5 },
      { id: "C2", name: "Apt Consolação View", avgRevenue: 9500, avgOccupancy: 75, avgDailyRate: 390, reviewScore: 4.3 },
      { id: "C3", name: "Studio Bela Vista", avgRevenue: 11200, avgOccupancy: 83, avgDailyRate: 445, reviewScore: 4.7 },
      { id: "C4", name: "Flat Jardins Elite", avgRevenue: 12500, avgOccupancy: 87, avgDailyRate: 480, reviewScore: 4.8 },
    ],
    "AP002": [
      { id: "C1", name: "Studio Pinheiros Art", avgRevenue: 7200, avgOccupancy: 80, avgDailyRate: 290, reviewScore: 4.5 },
      { id: "C2", name: "Loft Vila Mada", avgRevenue: 6800, avgOccupancy: 77, avgDailyRate: 280, reviewScore: 4.4 },
      { id: "C3", name: "Apt Sumaré Cool", avgRevenue: 6200, avgOccupancy: 73, avgDailyRate: 265, reviewScore: 4.2 },
      { id: "C4", name: "Studio Butantã", avgRevenue: 5500, avgOccupancy: 70, avgDailyRate: 245, reviewScore: 4.0 },
    ],
    "AP003": [
      { id: "C1", name: "Apt Ipanema Luxury", avgRevenue: 22000, avgOccupancy: 85, avgDailyRate: 860, reviewScore: 4.9 },
      { id: "C2", name: "Flat Leblon Beach", avgRevenue: 20500, avgOccupancy: 82, avgDailyRate: 820, reviewScore: 4.7 },
      { id: "C3", name: "Suite Copacabana", avgRevenue: 18500, avgOccupancy: 78, avgDailyRate: 780, reviewScore: 4.5 },
      { id: "C4", name: "Penthouse Leme", avgRevenue: 19000, avgOccupancy: 76, avgDailyRate: 790, reviewScore: 4.6 },
    ],
    "CS001": [
      { id: "C1", name: "Casa Itaim Garden", avgRevenue: 14500, avgOccupancy: 72, avgDailyRate: 680, reviewScore: 4.4 },
      { id: "C2", name: "Villa Moema", avgRevenue: 13200, avgOccupancy: 68, avgDailyRate: 660, reviewScore: 4.3 },
      { id: "C3", name: "Casa Brooklin", avgRevenue: 12800, avgOccupancy: 65, avgDailyRate: 640, reviewScore: 4.2 },
      { id: "C4", name: "Mansão Vila Nova", avgRevenue: 16000, avgOccupancy: 75, avgDailyRate: 720, reviewScore: 4.6 },
    ],
  };
  return competitors[propertyId] || competitors["AP001"];
}
