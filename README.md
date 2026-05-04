# Clínica Santana — CRM

Sistema de gestão de leads, consultas e campanhas de marketing desenvolvido sob medida para clínica de estética. Substitui o controle manual por WhatsApp/planilhas por uma plataforma web integrada com as ferramentas já usadas pela clínica.

---

## Funcionalidades

- **Dashboard financeiro** — faturamento do mês, metas (aceitável / ideal / super meta), progresso por barra visual
- **Gestão de leads** — kanban por status, histórico de interações, canal de origem, filtros avançados
- **Consultas** — cadastro, edição, importação via planilha XLSX, exportação, controle de status e pagamento
- **Campanhas Meta Ads** — sincronização automática via API do Meta, métricas de alcance, cliques, CPL e investimento
- **Indicadores** — taxa de conversão lead → consulta, comparativo entre períodos
- **Gestão de usuários** — controle de acesso por papel (Admin / Gestor / Atendente / Visualizador)
- **Integrações** — Meta Ads (OAuth + sync) e Kommo CRM (webhook em tempo real + polling)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| Linguagem | TypeScript |
| UI | Tailwind CSS v4, Radix UI, shadcn/ui |
| Formulários | React Hook Form + Zod |
| ORM | Prisma |
| Banco de dados | PostgreSQL (Neon — serverless) |
| Auth | NextAuth v5 (Prisma adapter) |
| Gráficos | Recharts |
| Planilhas | ExcelJS, XLSX |
| Deploy | Vercel |

---

## Integrações externas

### Meta Ads
- Autenticação via OAuth 2.0
- Sincronização de campanhas via cron diário (`/api/cron/meta-sync`)
- Métricas: alcance, impressões, cliques, leads gerados, custo por lead

### Kommo CRM
- Webhook para receber eventos em tempo real (novos leads, mudanças de status, notas)
- Validação de assinatura HMAC-SHA1
- Parser customizado para o formato `application/x-www-form-urlencoded` com notação PHP de arrays
- Polling como fallback via cron diário (`/api/cron/kommo-poll`)
- Mapeamento de estágios do funil Kommo → status interno

---

## Decisões técnicas relevantes

**Módulo boundary do Next.js (`"use server"`)**
Schemas Zod separados de server actions para permitir validação no cliente sem violar o contrato de módulos server-only do App Router.

**Prevenção de esgotamento do connection pool**
O sidebar com `prefetch` padrão do Next.js disparava dezenas de queries simultâneas na renderização inicial, esgotando o pool de 5 conexões do Neon free tier. Solução: `prefetch={false}` nos links de navegação.

**Timezone em datas**
`new Date("YYYY-MM-DD")` interpreta como UTC midnight, resultando no dia anterior no fuso UTC-3. Solução: construtor local `new Date(year, month - 1, day)` em todos os parsers de data.

**N+1 no webhook do Kommo**
Loop de `findUnique` + `create` por nota substituído por `findMany` em batch + `createMany`, eliminando N queries por evento.

---

## Arquitetura

```
src/
├── app/
│   ├── (protected)/          # Rotas autenticadas
│   │   ├── dashboard/
│   │   ├── leads/
│   │   ├── consultas/
│   │   ├── campanhas/
│   │   ├── financeiro/
│   │   ├── indicadores/
│   │   ├── integracoes/
│   │   └── usuarios/
│   └── api/
│       ├── cron/             # meta-sync, kommo-poll
│       ├── integracoes/      # OAuth callbacks
│       └── webhooks/         # Kommo webhook
├── actions/                  # Server actions (mutations)
├── components/               # UI components
└── lib/                      # prisma, auth, meta-api, kommo-api
```

---

## Variáveis de ambiente

```env
DATABASE_URL=          # Neon pooler URL
DIRECT_URL=            # Neon direct URL (migrations)
AUTH_SECRET=           # NextAuth secret
CRON_SECRET=           # Bearer token para proteção dos crons
META_APP_ID=
META_APP_SECRET=
KOMMO_CLIENT_ID=
KOMMO_CLIENT_SECRET=
KOMMO_SECRET=          # HMAC webhook secret
NEXT_PUBLIC_BASE_URL=
```

---

## Rodando localmente

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Aplicar migrations
npx prisma migrate dev

# Iniciar servidor de desenvolvimento
npm run dev
```

---

## Deploy

O projeto faz deploy automático na Vercel a cada push na branch `main`. Crons configurados via `vercel.json`.
