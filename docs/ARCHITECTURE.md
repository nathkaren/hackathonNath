# Arquitetura - ImóvelInsight

## Visão Geral

O ImóvelInsight é um dashboard web para análise de desempenho de imóveis de aluguel por temporada. O sistema permite inserir códigos de imóveis e receber uma análise completa incluindo comparação com concorrentes, avaliação de saúde, plano de ação e conclusão.

## Fluxo de Dados

```
Usuário → [Código do Imóvel + Solicitação]
         ↓
   page.tsx (Client)
         ↓
   mock-data.ts → PropertyData + CompetitorData
         ↓
   analyzer.ts → AnalysisResult
         ↓
   Componentes de Visualização
         ↓
   Dashboard Renderizado
```

## Componentes

### Motor de Análise (`src/lib/analyzer.ts`)

1. **calculateHealth()** - Calcula score de saúde comparando métricas do imóvel com média dos concorrentes
2. **generateActions()** - Gera plano de ação baseado nos gaps identificados
3. **generateConclusion()** - Produz texto conclusivo com insights acionáveis
4. **analyzeProperty()** - Orquestra toda a análise

### Componentes de UI (`src/components/`)

- **HealthGauge** - Visualização circular do health score com breakdown
- **PerformanceChart** - Gráficos temporais (LineChart + BarChart) via Recharts
- **CompetitorTable** - Tabela de benchmarking com indicadores visuais
- **ActionPlanCard** - Lista priorizada de ações recomendadas
- **ConclusionCard** - KPIs resumidos + análise textual

## Decisões Técnicas

| Decisão | Justificativa |
|---------|---------------|
| Next.js App Router | Deploy otimizado no Vercel, SSR/SSG automático |
| Client-side analysis | Sem necessidade de backend externo, resposta instantânea |
| Tailwind CSS 4 | Classes utilitárias, tema escuro consistente |
| Recharts | Biblioteca de gráficos mais popular para React |
| Mock data | Dados simulados para demonstração do hackathon |

## Extensibilidade

Para conectar com dados reais no futuro:
1. Substituir `mock-data.ts` por chamadas à API real
2. O `analyzer.ts` continua funcionando sem alterações
3. Adicionar autenticação na API route `/api/analyze`
