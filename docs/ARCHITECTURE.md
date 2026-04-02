# Arquitetura — Seazone Analysis Platform

## Visão Geral

Plataforma interna de análise de desempenho de imóveis via Data Lake Seazone. O sistema permite inserir IDs Seazone e receber análises completas geradas por Claude Sonnet 4.6, incluindo desempenho mês a mês, comparação com concorrentes, diagnóstico de gargalos e plano de ação.

## Fluxo de Dados

```
Usuário → [ID Seazone + Tipo Análise + Período + Tom + Contexto]
         ↓
   page.tsx (Client) → fetch /api/analyze
         ↓
   route.ts (Server) → API Anthropic (Claude Sonnet 4.6)
         ↓
   System Prompt (system-prompt.ts) + Dados Data Lake
         ↓
   Análise em Markdown
         ↓
   AnalysisRenderer.tsx → Dashboard Renderizado
```

## Camadas

### 1. Frontend (`src/app/page.tsx`)
- Formulário com campos: IDs, tipo de análise, período, tom, contexto
- Chama `POST /api/analyze`
- Renderiza resposta markdown via `AnalysisRenderer`

### 2. API Route (`src/app/api/analyze/route.ts`)
- Recebe payload do frontend
- Monta user message via `buildUserMessage()`
- Envia para API Anthropic com system prompt completo
- Suporta 2 modos:
  - **Com MCP** (`MCP_DATA_LAKE_URL`): Claude consulta Data Lake diretamente
  - **Sem MCP**: Claude analisa com base no prompt (fallback)

### 3. Data Lake Queries (`src/lib/datalake.ts`)
- Queries SQL validadas conforme system prompt Seazone
- Sufixos dos databases Sirius configuráveis via env vars
- Funções: `queryPropertyMonthly`, `queryCompetitorsMonthly`, `queryCompetitorsOccupancy`, `queryPerformanceDash`, `queryStuckMinPrice`, `queryLastOfferedPrice`, `queryReviews`, `queryDetailsRating`

### 4. System Prompt (`src/lib/system-prompt.ts`)
- Prompt completo do analista Seazone (idêntico ao seazone_system_prompt.md)
- Fórmulas SQL validadas, regras de negócio, formato de saída
- Exporta `buildUserMessage()` e constantes de tipos/períodos

### 5. Debug API (`src/app/api/datalake/route.ts`)
- Retorna as queries SQL que seriam executadas (sem executar)
- Útil para debug e validação

## Componentes Legados (`src/components/`)
Componentes da v1 (HealthGauge, PerformanceChart, CompetitorTable, ActionPlanCard, ConclusionCard) e dados mock (mock-data.ts, analyzer.ts, types.ts) permanecem no projeto mas não são usados pela página atual.

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `ANTHROPIC_API_KEY` | Sim | Chave da API Anthropic |
| `MCP_DATA_LAKE_URL` | Não | URL do MCP Data Lake (quando disponível) |
| `SIRIUS_COMPETITORSDATA` | Não | Override do database sirius (default: competitorsdata-ytphkan8jhr0) |
| `SIRIUS_REVENUEDATA` | Não | Override do database sirius (default: revenuedata-ljkritvzunqm) |
| `SIRIUS_SAPRONDATA` | Não | Override do database sirius (default: saprondata-9dkamzx2grjg) |
| `SIRIUS_PRICINGDATA` | Não | Override do database sirius (default: pricingdata-pzprucbusfet) |
| `SIRIUS_INPUTDATA` | Não | Override do database sirius (default: inputdata-kdatqapgmwx1) |

## Decisões Técnicas

| Decisão | Justificativa |
|---------|---------------|
| Next.js App Router | Deploy Vercel, API routes server-side, sem backend separado |
| Claude Sonnet 4.6 via API | Análise narrativa inteligente com regras de negócio Seazone |
| System prompt no código | Idêntico ao md original, versionado, tipado |
| react-markdown + remark-gfm | Renderização de tabelas, código, formatação do Claude |
| Queries SQL pré-montadas | Validadas conforme fórmulas do system prompt, parametrizáveis |
