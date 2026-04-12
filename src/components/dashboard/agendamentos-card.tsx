import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"

interface AgendamentosCardProps {
  novosQtd: number
  recorrenciaQtd: number
}

export function AgendamentosCard({ novosQtd, recorrenciaQtd }: AgendamentosCardProps) {
  const total = novosQtd + recorrenciaQtd

  return (
    <Card>
      <CardContent className="pt-5 px-6 pb-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Agendamentos</span>
          <Users className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <p className="text-4xl font-bold mt-3">{total}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {novosQtd} novos | {recorrenciaQtd} recorrentes
        </p>
      </CardContent>
    </Card>
  )
}
