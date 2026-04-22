import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface MetaProgressBarProps {
  realizado: number
  metaAceitavel: number
  metaIdeal: number
  superMeta: number
}

export function MetaProgressBar({
  realizado,
  metaAceitavel,
  metaIdeal,
  superMeta,
}: MetaProgressBarProps) {
  // Referência máxima: 120% da super meta para que a barra não fique "cheia" ao bater a meta
  const max = superMeta * 1.2
  const percentual = max > 0 ? Math.min((realizado / max) * 100, 100) : 0

  // Posições dos marcadores como % da barra total
  const posAceitavel = max > 0 ? Math.min((metaAceitavel / max) * 100, 100) : 0
  const posIdeal     = max > 0 ? Math.min((metaIdeal / max) * 100, 100) : 0
  const posSuper     = max > 0 ? Math.min((superMeta / max) * 100, 100) : 0

  type StatusInfo = { label: string; color: string; barColor: string }

  function getStatus(): StatusInfo {
    if (realizado >= superMeta) return {
      label: "Super Meta atingida!",
      color: "text-[var(--meta-batida)] font-bold",
      barColor: "var(--meta-batida)",
    }
    if (realizado >= metaIdeal) return {
      label: "Meta Ideal atingida!",
      color: "text-[var(--meta-ideal)] font-semibold",
      barColor: "var(--meta-ideal)",
    }
    if (realizado >= metaAceitavel) return {
      label: "Meta Aceitável atingida",
      color: "text-[var(--meta-aceitavel)]",
      barColor: "var(--meta-aceitavel)",
    }
    return {
      label: "Abaixo da meta aceitável",
      color: "text-[var(--meta-abaixo)]",
      barColor: "var(--meta-abaixo)",
    }
  }

  const status = getStatus()
  const percentualDisplay = superMeta > 0
    ? ((realizado / superMeta) * 100).toFixed(1)
    : "0.0"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Progresso do Faturamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-3xl font-bold">{formatCurrency(realizado)}</p>
            <p className={`text-sm font-medium mt-1 ${status.color}`}>{status.label}</p>
          </div>
          <p className="text-2xl font-bold text-muted-foreground">{percentualDisplay}%</p>
        </div>

        {/* Barra de progresso customizada com marcadores */}
        <div className="relative">
          {/* Trilha */}
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            {/* Preenchimento âmbar */}
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percentual}%`, backgroundColor: status.barColor }}
            />
          </div>

          {/* Marcadores verticais */}
          {[
            { pos: posAceitavel, label: "Aceit." },
            { pos: posIdeal,     label: "Ideal" },
            { pos: posSuper,     label: "Super" },
          ].map(({ pos, label }) => (
            <div
              key={label}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
            >
              {/* Linha pontilhada sobre a barra */}
              <div className="w-px h-3 border-l border-dashed border-muted-foreground/50" />
            </div>
          ))}
        </div>

        {/* Labels das metas — 3 colunas em sm+, lista vertical em mobile */}
        <div className="hidden sm:grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <p className="text-muted-foreground">Aceitável</p>
            <p className="font-semibold">{formatCurrency(metaAceitavel)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Ideal</p>
            <p className="font-semibold">{formatCurrency(metaIdeal)}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Super Meta</p>
            <p className="font-semibold">{formatCurrency(superMeta)}</p>
          </div>
        </div>
        <div className="sm:hidden space-y-1 text-xs">
          {([
            { label: "Aceitável", valor: metaAceitavel },
            { label: "Ideal",     valor: metaIdeal },
            { label: "Super Meta", valor: superMeta },
          ] as const).map((item) => (
            <div key={item.label} className="flex justify-between">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold">{formatCurrency(item.valor)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
