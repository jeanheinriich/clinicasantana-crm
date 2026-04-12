import { Card, CardContent } from "@/components/ui/card"
import { CalendarCheck } from "lucide-react"

interface ConsultasCardProps {
  realizadas: number
  agendadas: number
}

export function ConsultasCard({ realizadas, agendadas }: ConsultasCardProps) {
  const pct = agendadas > 0 ? (realizadas / agendadas) * 100 : 0
  const atingiu = pct >= 80

  return (
    <Card>
      <CardContent className="pt-5 px-6 pb-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Consultas do Mês</span>
          <CalendarCheck className="h-4 w-4" style={{ color: "hsl(36, 55%, 45%)" }} />
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-4xl font-bold">{realizadas}</span>
          <span className="text-2xl font-semibold text-muted-foreground">/ {agendadas}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">realizadas / agendadas</p>
        <p
          className="text-sm font-semibold mt-3"
          style={{
            color: atingiu
              ? "hsl(var(--meta-batida))"
              : "hsl(var(--meta-abaixo))",
          }}
        >
          {agendadas > 0 ? `${pct.toFixed(1)}% de realização` : "Sem agendamentos registrados"}
        </p>
      </CardContent>
    </Card>
  )
}
