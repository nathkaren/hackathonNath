import { NextRequest, NextResponse } from "next/server";
import { properties, getCompetitors } from "@/lib/mock-data";
import { analyzeProperty } from "@/lib/analyzer";

export async function POST(request: NextRequest) {
  const { codes } = await request.json();
  const results = [];
  for (const code of codes) {
    const property = properties[code.trim().toUpperCase()];
    if (property) {
      const competitors = getCompetitors(property.id);
      results.push(analyzeProperty(property, competitors));
    }
  }
  return NextResponse.json({ results });
}
