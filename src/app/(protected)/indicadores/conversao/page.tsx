import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ConversaoForm } from "@/components/indicadores/conversao-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { temPermissao } from "@/lib/permissions"
import type { PapelUsuario } from "@/lib/enums"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Calendar, CheckSquare } from "lucide-react"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

interface SearchParams { mes?: string; ano?: string }

function getBarColor(taxa: number): string {
  if (taxa >= 0.20) return "hsl(142, 45%, 42%)"
  if (taxa >= 0.15) return "hsl(36,  55%, 45%)"
  if (taxa >= 0.10) return "hsl(38,  70%, 52%)"
  return "hsl(20, 65%, 52%)"
}

export default async function IndicadorConversaoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const papel = session.user.papel as PapelUsuario
  if (!temPermissao(papel, "indicadores", "view")) redirect("/dashboard?erro=sem-permissao")

  const podeEditar = temPermissao(papel, "indicadores", "edit")
  const hoje = new Date()
  const params = await searchParams
  const mes = parseInt(params.mes ?? String(hoje.getMonth() + 1))
  const ano = parseInt(params.ano ?? String(hoje.getFullYear()))

  const [indicador, historico] = await Promise.all([
    prisma.indicadorConversao.findUnique({ where: { mes_ano: { mes, ano } } }),
    prisma.indicadorConversao.findMany({
      where: { ano },
      orderBy: { mes: "asc" },
    }),
  ])

  const totalLeads       = indicador?.totalLeads ?? 0
  const agendadas        = indicador?.consultasAgendadas ?? 0
  const realizadas       = indicador?.consultasRealizadas ?? 0
  const taxaFrac         = totalLeads > 0 ? realizadas / totalLeads : 0
  const taxaConversao    = totalLeads > 0 ? (taxaFrac * 100).toFixed(1) : "0.0"
  const taxaColor        = parseFloat(taxaConversao) >= 10 ? "hsl(36, 55%, 45%)" : "hsl(20, 65%, 52%)"

  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - 2 + i)

  const canais = [
    { nome: "TRAFEGO",           label: "Tráfego",        leads: indicador?.leadsTrafego ?? 0,     cor: "bg-amber-400",  text: "text-amber-700"  },
    { nome: "IMPULSIONAR",       label: "Impulsionar",    leads: indicador?.leadsImpulsionar ?? 0, cor: "bg-blue-400",   text: "text-blue-700"   },
    { nome: "REMARTIK",          label: "Remartik",       leads: indicador?.leadsRemartik ?? 0,    cor: "bg-purple-400", text: "text-purple-700" },
    { nome: "FC",                label: "FC",             leads: indicador?.leadsFC ?? 0,          cor: "bg-green-400",  text: "text-green-700"  },
    { nome: "LINK",              label: "Link",           leads: indicador?.leadsLink ?? 0,        cor: "bg-orange-400", text: "text-orange-700" },
    { nome: "FABRICA_INSTAGRAM", label: "Fáb. Instagram", leads: indicador?.leadsFabrica ?? 0,     cor: "bg-teal-400",   text: "text-teal-700"   },
  ]

  const funelSteps = [
    { Icon: Users,       label: "Leads Recebidos",      valor: totalLeads, iconColor: "text-blue-500"  },
    { Icon: Calendar,    label: "Consultas Agendadas",   valor: agendadas,  iconColor: "text-amber-500" },
    { Icon: CheckSquare, label: "Consultas Realizadas",  valor: realizadas, iconColor: "text-green-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Indicadores de Conversão</h2>
          <p className="text-muted-foreground text-sm">{MESES[mes - 1]} / {ano}</p>
        </div>
        <form method="GET" className="flex flex-wrap gap-2">
          <Select name="mes" defaultValue={String(mes)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select name="ano" defaultValue={String(ano)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anosDisponiveis.map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" variant="outline" size="sm">Ver</Button>
        </form>
      </div>

      {/* Card principal — Taxa + Funil + Canais */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Taxa de Conversão</CardTitle>
            <span className="text-xs text-muted-foreground">{MESES[mes - 1]} / {ano}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Coluna esquerda — KPI + funil */}
            <div className="flex-[55] space-y-5">
              {/* KPI principal */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                  Taxa de Conversão Geral
                </p>
                <p className="text-5xl font-bold mt-2" style={{ color: taxaColor }}>
                  {taxaConversao}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {realizadas} consultas realizadas de {totalLeads} leads
                </p>
              </div>

              <div className="border-t" />

              {/* Mini funil */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">
                  Funil do Mês
                </p>
                <div className="space-y-0">
                  {funelSteps.map(({ Icon, label, valor, iconColor }, idx) => (
                    <div key={label}>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
                          <span className="text-sm text-muted-foreground">{label}</span>
                        </div>
                        <span className="text-lg font-bold">{valor}</span>
                      </div>
                      {idx < funelSteps.length - 1 && (
                        <div className="ml-2 w-px h-3 bg-border" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Divisor vertical */}
            <div className="hidden lg:block w-px bg-border shrink-0" />

            {/* Coluna direita — Leads por canal */}
            <div className="flex-[45]">
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">
                Leads por Canal
              </p>
              <div className="space-y-3">
                {canais.map((canal) => {
                  const proporcao = totalLeads > 0 ? (canal.leads / totalLeads) * 100 : 0
                  return (
                    <div key={canal.nome}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${canal.text}`}>{canal.label}</span>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold">{canal.leads} leads</span>
                          <span className="text-muted-foreground text-xs w-8 text-right">
                            ({proporcao.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${canal.cor}`}
                          style={{ width: `${proporcao}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Histórico anual resumido */}
      {historico.length > 0 && (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mês</th>
                <th className="text-right p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Leads</th>
                <th className="text-right p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Realizadas</th>
                <th className="text-right p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground min-w-[120px]">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((h) => {
                const hTaxa = h.totalLeads > 0 ? h.consultasRealizadas / h.totalLeads : 0
                return (
                  <tr key={h.id} className={`border-b hover:bg-accent/50 transition-colors ${h.mes === mes ? "bg-muted/60 font-medium" : ""}`}>
                    <td className="p-3">{MESES[h.mes - 1]}</td>
                    <td className="p-3 text-right">{h.totalLeads}</td>
                    <td className="p-3 text-right">{h.consultasRealizadas}</td>
                    <td className="p-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-semibold" style={{ color: hTaxa >= 0.1 ? "hsl(36, 55%, 45%)" : "hsl(20, 65%, 52%)" }}>
                          {(hTaxa * 100).toFixed(1)}%
                        </span>
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(hTaxa * 100 * 5, 100)}%`,
                              backgroundColor: getBarColor(hTaxa),
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {podeEditar && (
        <ConversaoForm mes={mes} ano={ano} indicador={indicador ?? null} />
      )}
    </div>
  )
}
