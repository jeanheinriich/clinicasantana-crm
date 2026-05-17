import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface VendasCardProps {
  total: number
  novosQtd: number
  recQtd: number
  valorTotal: number
  ticketMedio: number | null
}

export function VendasCard({ total, novosQtd, recQtd, valorTotal, ticketMedio }: VendasCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 px-6 pb-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Vendas</span>
          <ShoppingBag className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <p className="text-4xl font-bold mt-3">{total}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {novosQtd} novos | {recQtd} recorrentes
        </p>
        <p className="text-sm font-medium mt-2">{formatCurrency(valorTotal)}</p>
        {ticketMedio != null && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Ticket: {formatCurrency(ticketMedio)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
