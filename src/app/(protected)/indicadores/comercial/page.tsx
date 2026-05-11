import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { calcularIndicadoresComerciais } from "@/lib/calcula-indicadores-comerciais"
import { Card, CardContent } from "@/components/ui/card"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { formatCurrency } from "@/lib/utils"
import { temPermissao } from "@/lib/permissions"
import type { PapelUsuario } from "@/lib/enums"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, DollarSign, RefreshCw, BarChart3, TrendingUp, BarChart2 } from "lucide-react"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

interface SearchParams { mes?: string; ano?: string }


export default async function IndicadorComercialPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const papel = session.user.papel as PapelUsuario
  if (!temPermissao(papel, "indicadores", "view")) redirect("/dashboard?erro=sem-permissao")

  const hoje = new Date()
  const params = await searchParams
  const mes = parseInt(params.mes ?? String(hoje.getMonth() + 1))
  const ano = parseInt(params.ano ?? String(hoje.getFullYear()))

  const mesAnt = mes === 1 ? 12 : mes - 1
  const anoAnt = mes === 1 ? ano - 1 : ano

  const [indicador, anterior] = await Promise.all([
    calcularIndicadoresComerciais(mes, ano),
    calcularIndicadoresComerciais(mesAnt, anoAnt),
  ])

  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - 2 + i)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Indicadores Comerciais</h2>
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

      {/* KPI cards comparativo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Agend. Novos (Qtd)"
          value={String(indicador.agendNovosQtd)}
          subtitle={`Mês anterior: ${anterior.agendNovosQtd}`}
          icon={Calendar}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <KpiCard
          title="Agend. Novos (Valor)"
          value={formatCurrency(indicador.agendNovosValor)}
          subtitle={`Mês anterior: ${formatCurrency(anterior.agendNovosValor)}`}
          icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-700"
        />
        <KpiCard
          title="Recorrência (Qtd)"
          value={String(indicador.recorrenciaQtd)}
          subtitle={`Mês anterior: ${anterior.recorrenciaQtd}`}
          icon={RefreshCw}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
        />
        <KpiCard
          title="Recorrência (Valor)"
          value={formatCurrency(indicador.recorrenciaValor)}
          subtitle={`Mês anterior: ${formatCurrency(anterior.recorrenciaValor)}`}
          icon={BarChart3}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
      </div>

      {/* Ticket médio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 px-5 pb-5">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Ticket Médio Novos</p>
              <TrendingUp className="h-4 w-4 shrink-0 text-amber-500" />
            </div>
            <p className="text-3xl font-bold mt-2">
              {indicador.agendNovosTicket > 0 ? formatCurrency(indicador.agendNovosTicket) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Mês anterior: {anterior.agendNovosTicket > 0 ? formatCurrency(anterior.agendNovosTicket) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 px-5 pb-5">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Ticket Médio Recorrência</p>
              <BarChart2 className="h-4 w-4 shrink-0 text-purple-500" />
            </div>
            <p className="text-3xl font-bold mt-2">
              {indicador.recorrenciaTicket > 0 ? formatCurrency(indicador.recorrenciaTicket) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Mês anterior: {anterior.recorrenciaTicket > 0 ? formatCurrency(anterior.recorrenciaTicket) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
