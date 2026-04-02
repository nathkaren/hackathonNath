# Documentação de Comandos - ImóvelInsight

## Comandos do Projeto

### Desenvolvimento
```bash
npm run dev        # Inicia servidor de desenvolvimento em http://localhost:3000
npm run build      # Gera build de produção
npm run start      # Inicia servidor de produção
npm run lint       # Executa linter (ESLint)
```

### Git & Deploy
```bash
git add .                                    # Adiciona alterações
git commit -m "descrição da alteração"       # Cria commit
git push origin main                         # Envia para o GitHub
# O deploy no Vercel é automático após push no GitHub
```

## Estrutura do Projeto

```
hackathonNath/
├── docs/                          # Documentação
│   ├── COMMANDS.md               # Este arquivo
│   └── ARCHITECTURE.md           # Arquitetura do sistema
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Layout raiz (metadata, HTML)
│   │   ├── globals.css           # Estilos globais (Tailwind + custom)
│   │   ├── page.tsx              # Página principal do dashboard
│   │   └── api/
│   │       └── analyze/
│   │           └── route.ts      # API REST para análise
│   ├── components/
│   │   ├── HealthGauge.tsx       # Gauge circular de saúde do imóvel
│   │   ├── PerformanceChart.tsx  # Gráficos de desempenho mensal
│   │   ├── CompetitorTable.tsx   # Tabela comparativa de concorrentes
│   │   ├── ActionPlanCard.tsx    # Cards de plano de ação
│   │   └── ConclusionCard.tsx    # KPIs e conclusão final
│   └── lib/
│       ├── types.ts              # Tipos TypeScript
│       ├── mock-data.ts          # Dados simulados dos imóveis
│       └── analyzer.ts           # Motor de análise e scoring
├── public/                        # Arquivos estáticos
├── package.json                   # Dependências e scripts
├── tsconfig.json                  # Configuração TypeScript
├── next.config.ts                 # Configuração Next.js
├── postcss.config.mjs            # Configuração PostCSS/Tailwind
└── .gitignore                    # Arquivos ignorados pelo Git
```

## Como Usar o Dashboard

### 1. Inserir Código(s) do Imóvel
No campo "Código dos Imóveis", insira um ou mais códigos separados por vírgula:
- `AP001` - Flat Paulista Premium (São Paulo)
- `AP002` - Studio Vila Madalena (São Paulo)
- `AP003` - Cobertura Copacabana (Rio de Janeiro)
- `CS001` - Casa Jardins Charm (São Paulo)

Exemplo: `AP001, AP003`

### 2. Descrever a Solicitação
No campo "Solicitação", descreva o que deseja analisar. Exemplos:
- "Quero entender por que a ocupação caiu nos últimos meses"
- "Comparar desempenho com concorrentes da região"
- "Avaliar se devo ajustar o preço da diária"

### 3. Clicar em "Analisar"
O sistema processará os dados e exibirá:

| Seção | Descrição |
|-------|-----------|
| **Saúde do Imóvel** | Score de 0-100 com breakdown por categoria |
| **Desempenho Mensal** | Gráficos de receita e ocupação vs concorrentes |
| **Concorrentes** | Tabela comparativa com métricas dos concorrentes |
| **Plano de Ação** | Ações priorizadas com impacto esperado |
| **Conclusão** | KPIs resumidos e análise textual completa |

## API

### POST /api/analyze
Análise de imóveis via API REST.

**Request:**
```json
{
  "codes": ["AP001", "AP002"]
}
```

**Response:**
```json
{
  "results": [
    {
      "property": { ... },
      "competitors": [ ... ],
      "health": { "overall": 85, "status": "bom", ... },
      "actions": [ ... ],
      "conclusion": "O imóvel..."
    }
  ]
}
```

## Tecnologias

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Next.js | 16 | Framework React full-stack |
| React | 19 | Biblioteca UI |
| TypeScript | 6 | Tipagem estática |
| Tailwind CSS | 4 | Estilização utilitária |
| Recharts | 3.8 | Gráficos e visualizações |
| Lucide React | 1.7 | Ícones |
| Vercel | - | Hosting e deploy |

## Métricas de Saúde (Health Score)

O score é calculado com pesos:
- **Receita (35%)** - Comparação com média dos concorrentes
- **Ocupação (25%)** - Taxa de ocupação vs mercado
- **Precificação (20%)** - Diária média vs concorrentes
- **Avaliações (20%)** - Nota vs média do mercado

### Classificação
| Score | Status | Cor |
|-------|--------|-----|
| 90-100 | Excelente | Verde |
| 75-89 | Bom | Azul |
| 60-74 | Atenção | Amarelo |
| 0-59 | Crítico | Vermelho |
