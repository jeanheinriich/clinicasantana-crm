import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface TicketMedioSectionProps {
  realizado: number
  totalQtd: number
  ticketNovosValor: number
  ticketNovosQtd: number
  ticketRecValor: number
  ticketRecQtd: number
}

export function TicketMedioSection({
  realizado,
  totalQtd,
  ticketNovosValor,
  ticketNovosQtd,
  ticketRecValor,
  ticketRecQtd,
}: TicketMedioSectionProps) {
  const ticketGeral = totalQtd > 0 ? realizado / totalQtd : 0
  const ticketNovos = ticketNovosQtd > 0 ? ticketNovosValor / ticketNovosQtd : 0
  const ticketRec   = ticketRecQtd > 0 ? ticketRecValor / ticketRecQtd : 0

  const cards = [
    {
      label: "Geral",
      valor: ticketGeral > 0 ? formatCurrency(ticketGeral) : "—",
      sub: `${totalQtd} consultas`,
    },
    {
      label: "Novos",
      valor: ticketNovos > 0 ? formatCurrency(ticketNovos) : "—",
      sub: `${ticketNovosQtd} novas consultas`,
    },
    {
      label: "Recorrência",
      valor: ticketRec > 0 ? formatCurrency(ticketRec) : "—",
      sub: `${ticketRecQtd} recorrentes`,
    },
  ]

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        Ticket Médio
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
