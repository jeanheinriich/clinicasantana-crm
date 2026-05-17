import { Card, CardContent } from "@/components/ui/card"
import { Share2, Briefcase, Calendar, CheckSquare, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface FunilSectionProps {
  totalLeads: number
  seguidores: number
  agendNovasCriadas: number
  consultasAgendadas: number
  consultasRealizadas: number
  agendadasNovas: number
  agendadasRecorrencia: number
  realizadasNovas: number
  realizadasRecorrencia: number
  novosQtd: number
  recorrenciaQtd: number
  realizado: number
  totalQtd: number
  superMeta: number
  cplGeral?: number | null
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
  seguidores,
  agendNovasCriadas,
  consultasAgendadas,
  consultasRealizadas,
  agendadasNovas,
  agendadasRecorrencia,
  realizadasNovas,
  realizadasRecorrencia,
  novosQtd,
  recorrenciaQtd,
  realizado,
  totalQtd,
  superMeta,
  cplGeral,
}: FunilSectionProps) {
  const taxaLeadsSeg      = seguidores > 0 ? (totalLeads / seguidores) * 100 : 0
  const taxaConvComercial = totalLeads > 0 ? (agendNovasCriadas / totalLeads) * 100 : 0
  const taxaConvLeads     = totalLeads > 0 ? (consultasAgendadas / totalLeads) * 100 : 0
  const taxaRealizacao    = consultasAgendadas > 0 ? (consultasRealizadas / consultasAgendadas) * 100 : 0
  const ticketMedio       = totalQtd > 0 ? realizado / totalQtd : 0
  const pctMeta           = superMeta > 0 ? (realizado / superMeta) * 100 : 0

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        Funil de Conversão
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">

        {/* Card 1 — Social Media */}
        <Card>
          <CardContent className="pt-5 px-5 pb-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">Social Media</p>
              <Share2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--canal-impulsionar)" }} />
            </div>
            <p className="text-3xl font-bold mt-2">{seguidores.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">seguidores ganhos</p>
            <div className="border-t mt-3 mb-2" />
            <p className="text-xs text-muted-foreground">{totalLeads} leads recebidos</p>
            {seguidores > 0 && (
              <p
                className="text-xs font-semibold mt-1"
                style={{ color: taxaColor(taxaLeadsSeg, 5) }}
              >
                {taxaLeadsSeg.toFixed(1)}% de conversão
              </p>
            )}
            {cplGeral != null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                R$ {cplGeral.toFixed(2).replace(".", ",")} custo/lead
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card 2 — Comercial */}
        <Card>
          <CardContent className="pt-5 px-5 pb-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">Comercial</p>
              <Briefcase className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/50" />
            </div>
            <p className="text-3xl font-bold mt-2">{totalLeads}</p>
            <p className="text-xs text-muted-foreground mt-0.5">leads</p>
            <div className="border-t mt-3 mb-2" />
            <p className="text-xs text-muted-foreground">{agendNovasCriadas} agendamentos novos</p>
            {totalLeads > 0 && (
              <p
                className="text-xs font-semibold mt-1"
                style={{ color: taxaColor(taxaConvComercial, 5) }}
              >
                {taxaConvComercial.toFixed(1)}% de conversão
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card 3 — Consultas Agendadas */}
        <Card>
          <CardContent className="pt-5 px-5 pb-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">Consultas Agendadas</p>
              <Calendar className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(36, 55%, 45%)" }} />
            </div>
            <p className="text-3xl font-bold mt-2">{consultasAgendadas}</p>
            <p className="text-xs text-muted-foreground mt-0.5">agendamentos no mês</p>
            <p className="text-xs text-muted-foreground mt-2">
              {agendadasNovas} novos | {agendadasRecorrencia} recorrentes
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

        {/* Card 4 — Consultas Realizadas */}
        <Card>
          <CardContent className="pt-5 px-5 pb-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">Consultas Realizadas</p>
              <CheckSquare className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--meta-batida)" }} />
            </div>
            <p className="text-3xl font-bold mt-2">{consultasRealizadas}</p>
            <p className="text-xs text-muted-foreground mt-0.5">consultas no mês</p>
            <p className="text-xs text-muted-foreground mt-2">
              {realizadasNovas} novos | {realizadasRecorrencia} recorrentes
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

        {/* Card 5 — Faturamento Gerado */}
        <Card>
          <CardContent className="pt-5 px-5 pb-5">
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">Faturamento Gerado</p>
              <DollarSign className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--meta-super)" }} />
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
