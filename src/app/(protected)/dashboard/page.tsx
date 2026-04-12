import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { MonthNav } from "@/components/dashboard/month-nav"
import { DashboardHero } from "@/components/dashboard/dashboard-hero"
import { ConsultasCard } from "@/components/dashboard/consultas-card"
import { AgendamentosCard } from "@/components/dashboard/agendamentos-card"
import { TicketMedioSection } from "@/components/dashboard/ticket-medio-section"
import { FunilSection } from "@/components/dashboard/funil-section"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
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

  const [metaFinanceira, consultasAggregate, indicadorComercial, indicadorConversao] =
    await Promise.all([
      prisma.metaFinanceira.findUnique({ where: { mes_ano: { mes, ano } } }),
      prisma.consulta.aggregate({
        where: { mes, ano, status: "REALIZADA" },
        _sum: { valor: true },
        _count: true,
      }),
      prisma.indicadorComercial.findUnique({ where: { mes_ano: { mes, ano } } }),
      prisma.indicadorConversao.findUnique({ where: { mes_ano: { mes, ano } } }),
    ])

  const realizado = Number(consultasAggregate._sum.valor ?? 0)
  const isMesAtual = mes === hoje.getMonth() + 1 && ano === hoje.getFullYear()
  const diasCorridos = isMesAtual ? hoje.getDate() : new Date(ano, mes, 0).getDate()
  const diasDoMes = new Date(ano, mes, 0).getDate()

  const novosQtd = indicadorComercial?.agendamentosNovosQtd ?? 0
  const recorrenciaQtd = indicadorComercial?.recorrenciaQtd ?? 0
  const novosValor = indicadorComercial ? Number(indicadorComercial.agendamentosNovosValor) : 0
  const recorrenciaValor = indicadorComercial ? Number(indicadorComercial.recorrenciaValor) : 0

  const consultasAgendadasCount = indicadorConversao?.consultasAgendadas ?? 0
  const consultasRealizadasCount = indicadorConversao?.consultasRealizadas ?? consultasAggregate._count
  const totalQtdConsultas = novosQtd + recorrenciaQtd || consultasAggregate._count

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              novosValor={indicadorComercial ? novosValor : undefined}
              recorrenciaValor={indicadorComercial ? recorrenciaValor : undefined}
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
      {indicadorComercial ? (
        <TicketMedioSection
          novosValor={novosValor}
          novosQtd={novosQtd}
          recorrenciaValor={recorrenciaValor}
          recorrenciaQtd={recorrenciaQtd}
          realizado={realizado}
          diasCorridos={diasCorridos}
          diasDoMes={diasDoMes}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Ticket Médio
          </p>
          <p className="text-sm text-muted-foreground">
            Indicadores comerciais não cadastrados para {MESES[mes - 1]}/{ano}.{" "}
            <a href="/indicadores/comercial" className="underline text-foreground">
              Cadastrar
            </a>
          </p>
        </div>
      )}

      {/* Row 3: Funil de Conversão */}
      {indicadorConversao ? (
        <FunilSection
          totalLeads={indicadorConversao.totalLeads}
          leadsTrafego={indicadorConversao.leadsTrafego}
          leadsImpulsionar={indicadorConversao.leadsImpulsionar}
          leadsRemartik={indicadorConversao.leadsRemartik}
          leadsFC={indicadorConversao.leadsFC}
          consultasAgendadas={consultasAgendadasCount}
          consultasRealizadas={consultasRealizadasCount}
          novosQtd={novosQtd}
          recorrenciaQtd={recorrenciaQtd}
          realizado={realizado}
          totalQtd={totalQtdConsultas}
          superMeta={metaFinanceira ? Number(metaFinanceira.superMeta) : 0}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Funil de Conversão
          </p>
          <p className="text-sm text-muted-foreground">
            Indicadores de conversão não cadastrados para {MESES[mes - 1]}/{ano}.{" "}
            <a href="/indicadores/conversao" className="underline text-foreground">
              Cadastrar
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
