import { Card, CardContent } from "@/components/ui/card"
import { Users, Calendar, CheckSquare, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface FunilSectionProps {
  totalLeads: number
  leadsTrafego: number
  leadsImpulsionar: number
  leadsRemartik: number
  leadsFC: number
  consultasAgendadas: number
  consultasRealizadas: number
  novosQtd: number
  recorrenciaQtd: number
  realizado: number
  totalQtd: number
  superMeta: number
}

function taxaColor(taxa: number, limiar: number): string {
  return taxa >= limiar ? "var(--meta-batida)" : "var(--meta-abaixo)"
}

function metaProgressColor(pct: number): string {
  if (pct >= 100) return "var(--meta-batida)"
  if (pct >= 86)  return "var(--meta-ideal)"
  if (pct >= 75)  return "var(--meta-aceitavel)"
  return "var(--meta-abaixo)"
}

export function FunilSection({
  totalLeads,
  leadsTrafego,
  leadsImpulsionar,
  leadsRemartik,
  leadsFC,
  consultasAgendadas,
  consultasRealizadas,
  novosQtd,
  recorrenciaQtd,
  realizado,
  totalQtd,
  superMeta,
}: FunilSectionProps) {
  const taxaConvLeads = totalLeads > 0
    ? (consultasAgendadas / totalLeads) * 100
    : 0
  const taxaRealizacao = consultasAgendadas > 0
    ? (consultasRealizadas / consultasAgendadas) * 100
    : 0
  const ticketMedio = totalQtd > 0 ? realizado / totalQtd : 0
  const pctMeta = superMeta > 0 ? (realizado / superMeta) * 100 : 0

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        Funil de Conversão
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1 — Leads Recebidos */}
        <Card>
          <CardContent className="pt-5 px-5 pb-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">Leads Recebidos</p>
              <Users className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--canal-impulsionar)" }} />
            </div>
            <p className="text-3xl font-bold mt-2">{totalLeads}</p>
            <p className="text-xs text-muted-foreground mt-0.5">leads no mês</p>
            <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
              {leadsTrafego > 0 && <p>{leadsTrafego} Tráfego</p>}
              {leadsImpulsionar > 0 && <p>{leadsImpulsionar} Impulsionar</p>}
              {leadsRemartik > 0 && <p>{leadsRemartik} Remartik</p>}
              {leadsFC > 0 && <p>{leadsFC} FC</p>}
            </div>
            {totalLeads > 0 && (
              <p
                className="text-xs font-semibold mt-2"
                style={{ color: taxaColor(taxaConvLeads, 5) }}
              >
                {taxaConvLeads.toFixed(1)}% conversão
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card 2 — Consultas Agendadas */}
        <Card>
          <CardContent className="pt-5 px-5 pb-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">Consultas Agendadas</p>
              <Calendar className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(36, 55%, 45%)" }} />
            </div>
            <p className="text-3xl font-bold mt-2">{consultasAgendadas}</p>
            <p className="text-xs text-muted-foreground mt-0.5">agendamentos no mês</p>
            <p className="text-xs text-muted-foreground mt-2">
              {novosQtd} novos | {recorrenciaQtd} recorrentes
            </p>
            {totalLeads > 0 && (
              <p
                className="text-xs font-semibold mt-1"
                style={{ color: taxaColor(taxaConvLeads, 5) }}
              >
                {taxaConvLeads.toFixed(1)}% de conversão
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card 3 — Consultas Realizadas */}
        <Card>
          <CardContent className="pt-5 px-5 pb-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">Consultas Realizadas</p>
              <CheckSquare className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--meta-batida))" }} />
            </div>
            <p className="text-3xl font-bold mt-2">{consultasRealizadas}</p>
            <p className="text-xs text-muted-foreground mt-0.5">consultas no mês</p>
            <p className="text-xs text-muted-foreground mt-2">
              {novosQtd} novos | {recorrenciaQtd} recorrentes
            </p>
            {consultasAgendadas > 0 && (
              <p
                className="text-xs font-semibold mt-1"
                style={{ color: taxaColor(taxaRealizacao, 80) }}
              >
                {taxaRealizacao.toFixed(1)}% de realização
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card 4 — Faturamento Gerado */}
        <Card>
          <CardContent className="pt-5 px-5 pb-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">Faturamento Gerado</p>
              <DollarSign className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--meta-super))" }} />
            </div>
            <p className="text-3xl font-bold mt-2">{formatCurrency(realizado)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">faturamento do mês</p>
            {ticketMedio > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                ticket médio: {formatCurrency(ticketMedio)}
              </p>
            )}
            {superMeta > 0 && (
              <p
                className="text-xs font-semibold mt-1"
                style={{ color: metaProgressColor(pctMeta) }}
              >
                {pctMeta.toFixed(1)}% da Super Meta
              </p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
