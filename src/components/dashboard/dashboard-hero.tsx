import { Card, CardContent } from "@/components/ui/card"
import { Target } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface DashboardHeroProps {
  realizado: number
  metaAceitavel: number
  metaIdeal: number
  superMeta: number
  novosValor?: number
  recorrenciaValor?: number
}

type StatusInfo = {
  badgeText: string
  barColor: string
  textColor: string
  refLabel: string
  refValor: number
}

function getStatus(
  realizado: number,
  metaAceitavel: number,
  metaIdeal: number,
  superMeta: number,
): StatusInfo {
  if (realizado >= superMeta) return {
    badgeText: "Super Meta",
    barColor: "hsl(var(--meta-batida))",
    textColor: "hsl(var(--meta-batida))",
    refLabel: "Super Meta",
    refValor: superMeta,
  }
  if (realizado >= metaIdeal) return {
    badgeText: "Meta Ideal",
    barColor: "hsl(var(--meta-ideal))",
    textColor: "hsl(var(--meta-ideal))",
    refLabel: "Super Meta",
    refValor: superMeta,
  }
  if (realizado >= metaAceitavel) return {
    badgeText: "Meta Aceitável",
    barColor: "hsl(var(--meta-aceitavel))",
    textColor: "hsl(var(--meta-aceitavel))",
    refLabel: "Meta Ideal",
    refValor: metaIdeal,
  }
  return {
    badgeText: "Abaixo da Meta",
    barColor: "hsl(var(--meta-abaixo))",
    textColor: "hsl(var(--meta-abaixo))",
    refLabel: "Meta Aceitável",
    refValor: metaAceitavel,
  }
}

export function DashboardHero({
  realizado,
  metaAceitavel,
  metaIdeal,
  superMeta,
  novosValor,
  recorrenciaValor,
}: DashboardHeroProps) {
  const max = superMeta * 1.2
  const pctBarra = max > 0 ? Math.min((realizado / max) * 100, 100) : 0
  const posAceit = max > 0 ? Math.min((metaAceitavel / max) * 100, 99.5) : 0
  const posIdeal = max > 0 ? Math.min((metaIdeal / max) * 100, 99.5) : 0
  const posSuper = max > 0 ? Math.min((superMeta / max) * 100, 99.5) : 0

  const status = getStatus(realizado, metaAceitavel, metaIdeal, superMeta)
  const pctSuperMeta = superMeta > 0 ? ((realizado / superMeta) * 100).toFixed(1) : "0.0"

  const hasBreakdown = novosValor !== undefined && recorrenciaValor !== undefined
  const totalBreakdown = (novosValor ?? 0) + (recorrenciaValor ?? 0)
  const pctNovos = totalBreakdown > 0
    ? ((novosValor ?? 0) / totalBreakdown * 100).toFixed(1)
    : "0.0"
  const pctRec = totalBreakdown > 0
    ? ((recorrenciaValor ?? 0) / totalBreakdown * 100).toFixed(1)
    : "0.0"

  return (
    <Card className="h-full">
      <CardContent className="pt-5 px-6 pb-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Faturamento Total</span>
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border"
              style={{
                color: status.textColor,
                borderColor: status.barColor,
                backgroundColor: `color-mix(in srgb, ${status.barColor} 12%, transparent)`,
              }}
            >
              {status.badgeText}
            </span>
          </div>
          <Target className="h-4 w-4 shrink-0" style={{ color: status.textColor }} />
        </div>

        {/* Value */}
        <p className="text-4xl font-bold tracking-tight mt-3">{formatCurrency(realizado)}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {status.refLabel}: {formatCurrency(status.refValor)}
        </p>

        {/* Progress bar */}
        <div className="mt-4 relative">
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pctBarra}%`, backgroundColor: status.barColor }}
            />
          </div>
          {[posAceit, posIdeal, posSuper].map((pos, i) => (
            <div
              key={i}
              className="absolute top-0 h-2.5 border-l border-dashed border-muted-foreground/40"
              style={{ left: `${pos}%` }}
            />
          ))}
        </div>
        <p className="text-xs font-semibold mt-1.5" style={{ color: status.textColor }}>
          {pctSuperMeta}% da Super Meta
        </p>

        {/* Breakdown Novos / Recorrência */}
        {hasBreakdown && (
          <div className="mt-4 pt-4 border-t space-y-1.5">
            {[
              { label: "Novos",       valor: novosValor ?? 0,       pct: pctNovos },
              { label: "Recorrência", valor: recorrenciaValor ?? 0, pct: pctRec   },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <div className="flex items-center gap-8 tabular-nums">
                  <span className="font-medium">{formatCurrency(row.valor)}</span>
                  <span className="text-muted-foreground w-10 text-right">{row.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
