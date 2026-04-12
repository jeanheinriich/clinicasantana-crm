import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface TicketMedioSectionProps {
  novosValor: number
  novosQtd: number
  recorrenciaValor: number
  recorrenciaQtd: number
  realizado: number
  diasCorridos: number
  diasDoMes: number
}

export function TicketMedioSection({
  novosValor,
  novosQtd,
  recorrenciaValor,
  recorrenciaQtd,
  realizado,
  diasCorridos,
  diasDoMes,
}: TicketMedioSectionProps) {
  const totalQtd = novosQtd + recorrenciaQtd
  const totalValor = novosValor + recorrenciaValor
  const ticketGeral = totalQtd > 0 ? totalValor / totalQtd : 0
  const ticketNovos = novosQtd > 0 ? novosValor / novosQtd : 0
  const ticketRec = recorrenciaQtd > 0 ? recorrenciaValor / recorrenciaQtd : 0
  const faturamentoDiario = diasCorridos > 0 ? realizado / diasCorridos : 0
  const projecaoMensal = faturamentoDiario * diasDoMes

  const cards = [
    {
      label: "Geral",
      valor: ticketGeral > 0 ? formatCurrency(ticketGeral) : "—",
      sub: `${totalQtd} consultas`,
    },
    {
      label: "Novos",
      valor: ticketNovos > 0 ? formatCurrency(ticketNovos) : "—",
      sub: `${novosQtd} novas consultas`,
    },
    {
      label: "Recorrência",
      valor: ticketRec > 0 ? formatCurrency(ticketRec) : "—",
      sub: `${recorrenciaQtd} recorrentes`,
    },
    {
      label: "Diário",
      valor: faturamentoDiario > 0 ? formatCurrency(faturamentoDiario) : "—",
      sub: projecaoMensal > 0
        ? `projeção: ${formatCurrency(projecaoMensal)}`
        : `média de ${diasCorridos} dias`,
    },
  ]

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        Ticket Médio
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-5 px-5 pb-5">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold mt-1.5">{card.valor}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
