import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { MonthNav } from "@/components/dashboard/month-nav"
import { DashboardHero } from "@/components/dashboard/dashboard-hero"
import { ConsultasCard } from "@/components/dashboard/consultas-card"
import { AgendamentosCard } from "@/components/dashboard/agendamentos-card"
import { TicketMedioSection } from "@/components/dashboard/ticket-medio-section"
import { FunilSection } from "@/components/dashboard/funil-section"
import { FaturamentoLineChart } from "@/components/dashboard/faturamento-line-chart"
import { LeadsBarChart } from "@/components/dashboard/leads-bar-chart"
import { calcularIndicadoresConversao } from "@/lib/calcula-indicadores-conversao"
import { calcularCPLPorCanal } from "@/lib/calcula-cpl"
import { calcularIndicadoresComerciais } from "@/lib/calcula-indicadores-comerciais"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

const CANAIS = [
  { value: "IMPULSIONAR",       label: "Impulsionar" },
  { value: "REMARTIK",          label: "Remartik"    },
  { value: "TRAFEGO",           label: "Tráfego"     },
  { value: "FC",                label: "FC"          },
  { value: "LINK",              label: "Link"        },
  { value: "FABRICA_INSTAGRAM", label: "Fáb. Inst."  },
  { value: "TURBINAR",          label: "Turbinar"    },
  { value: "OUTRO",             label: "Outro"       },
]

interface SearchParams { mes?: string; ano?: string }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const hoje = new Date()
  const params = await searchParams
  const mes = parseInt(params.mes ?? String(hoje.getMonth() + 1))
  const ano = parseInt(params.ano ?? String(hoje.getFullYear()))

  const [
    metaFinanceira,
    consultasAggregate,
    indicadorComercial,
    conversao,
    cpl,
    realizadosPorMes,
    leadsPorCanalRaw,
  ] = await Promise.all([
    prisma.metaFinanceira.findUnique({ where: { mes_ano: { mes, ano } } }),
    prisma.consulta.aggregate({
      where: { mesPagamento: mes, anoPagamento: ano, dataPagamento: { not: null }, status: { not: "CANCELADA" } },
      _sum: { valor: true },
      _count: true,
    }),
    calcularIndicadoresComerciais(mes, ano),
    calcularIndicadoresConversao(mes, ano),
    calcularCPLPorCanal(mes, ano),
    prisma.consulta.groupBy({
      by: ["mesPagamento"],
      where: { anoPagamento: ano, dataPagamento: { not: null }, status: { not: "CANCELADA" } },
      _sum: { valor: true },
    }),
    prisma.lead.groupBy({
      by: ["canal"],
      where: {
        dataCriacao: {
          gte: new Date(ano, mes - 1, 1),
          lt:  new Date(ano, mes,     1),
        },
      },
      _count: { _all: true },
    }),
  ])

  const realizado = Number(consultasAggregate._sum.valor ?? 0)

  const novosQtd = indicadorComercial.agendNovosQtd
  const recorrenciaQtd = indicadorComercial.recorrenciaQtd
  const novosValor = indicadorComercial.agendNovosValor
  const recorrenciaValor = indicadorComercial.recorrenciaValor

  const consultasAgendadasCount = conversao.consultasAgendadas
  const consultasRealizadasCount = conversao.consultasRealizadas
  const totalQtdConsultas = novosQtd + recorrenciaQtd || consultasAggregate._count

  // Gráfico de área: Jan → mês selecionado
  const faturamentoMeses = Array.from({ length: mes }, (_, i) => {
    const m = i + 1
    const r = realizadosPorMes.find((r) => r.mesPagamento === m)
    const val = r ? Number(r._sum.valor ?? 0) : null
    return { mes: MESES_ABREV[i], realizado: val }
  })

  // Gráfico de barras: somente canais com leads
  const leadsPorCanalData = CANAIS
    .map(({ value, label }) => ({
      canal: label,
      key: value,
      quantidade: leadsPorCanalRaw.find((l) => l.canal === value)?._count._all ?? 0,
    }))
    .filter((item) => item.quantidade > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Visão geral dos indicadores de {MESES[mes - 1].toLowerCase()} de {ano}
          </p>
        </div>
        <MonthNav mes={mes} ano={ano} />
      </div>

      {/* Row 1: Hero + cards laterais */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          {metaFinanceira ? (
            <DashboardHero
              realizado={realizado}
              metaAceitavel={Number(metaFinanceira.metaAceitavel)}
              metaIdeal={Number(metaFinanceira.metaIdeal)}
              superMeta={Number(metaFinanceira.superMeta)}
              novosValor={novosValor}
              recorrenciaValor={recorrenciaValor}
            />
          ) : (
            <div className="h-full min-h-[260px] rounded-lg border border-dashed flex items-center justify-center p-8 text-center text-muted-foreground text-sm">
              <div>
                Nenhuma meta configurada para {MESES[mes - 1]}/{ano}.{" "}
                <a href="/financeiro/metas" className="underline text-foreground">
                  Configurar metas
                </a>
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-2 flex flex-col gap-4">
          <ConsultasCard
            realizadas={consultasRealizadasCount}
            agendadas={consultasAgendadasCount}
          />
          <AgendamentosCard novosQtd={novosQtd} recorrenciaQtd={recorrenciaQtd} />
        </div>
      </div>

      {/* Row 2: Ticket Médio */}
      <TicketMedioSection
        realizado={realizado}
        totalQtd={indicadorComercial.totalQtd}
        ticketNovosValor={indicadorComercial.ticketNovosValor}
        ticketNovosQtd={indicadorComercial.ticketNovosQtd}
        ticketRecValor={indicadorComercial.ticketRecValor}
        ticketRecQtd={indicadorComercial.ticketRecQtd}
      />

      {/* Row 3: Funil de Conversão */}
      <FunilSection
        totalLeads={conversao.totalLeads}
        leadsTrafego={conversao.leadsTrafego}
        leadsImpulsionar={conversao.leadsImpulsionar}
        leadsRemartik={conversao.leadsRemartik}
        leadsFC={conversao.leadsFC}
        consultasAgendadas={consultasAgendadasCount}
        consultasRealizadas={consultasRealizadasCount}
        novosQtd={novosQtd}
        recorrenciaQtd={recorrenciaQtd}
        realizado={realizado}
        totalQtd={totalQtdConsultas}
        superMeta={metaFinanceira ? Number(metaFinanceira.superMeta) : 0}
        cplGeral={cpl.cplGeral}
      />

      {/* Row 4: Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FaturamentoLineChart data={faturamentoMeses} />
        <LeadsBarChart data={leadsPorCanalData} />
      </div>
    </div>
  )
}
