"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, startOfMonth, endOfMonth, subMonths, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface PeriodoFilterProps {
  deParam:  string
  ateParam: string
  totalInvestimento?: number
}

const ATALHOS = [
  { label: "Este mês",       range: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Mês passado",    range: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: "Últimos 30 dias",range: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "Últimos 90 dias",range: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
]

function parseLocal(s: string): Date {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function PeriodoFilter({ deParam, ateParam, totalInvestimento }: PeriodoFilterProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [periodo, setPeriodo] = useState<DateRange>({
    from: deParam  ? parseLocal(deParam)  : startOfMonth(new Date()),
    to:   ateParam ? parseLocal(ateParam) : new Date(),
  })

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  function aplicar(range?: DateRange) {
    const r = range ?? periodo
    if (!r?.from || !r?.to) return
    const params = new URLSearchParams()
    params.set("de",  format(r.from, "yyyy-MM-dd"))
    params.set("ate", format(r.to,   "yyyy-MM-dd"))
    router.replace(`/campanhas?${params.toString()}`, { scroll: false })
    setOpen(false)
  }

  const label = periodo.from && periodo.to
    ? `${format(periodo.from, "dd/MM/yyyy")} – ${format(periodo.to, "dd/MM/yyyy")}`
    : "Selecionar período"

  const totalFormatado = totalInvestimento != null
    ? totalInvestimento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : null

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 w-full sm:min-w-[240px] sm:w-auto justify-start">
            <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" side="bottom">
          {/* Atalhos rápidos */}
          <div className="flex flex-wrap gap-1 p-3 border-b border-border">
            {ATALHOS.map((a) => (
              <Button
                key={a.label}
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  const r = a.range()
                  setPeriodo(r)
                  aplicar(r)
                }}
              >
                {a.label}
              </Button>
            ))}
          </div>

          <Calendar
            mode="range"
            selected={periodo}
            onSelect={(r) => r && setPeriodo(r)}
            locale={ptBR}
            numberOfMonths={isMobile ? 1 : 2}
            initialFocus
          />

          <div className="flex justify-end gap-2 p-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPeriodo({ from: startOfMonth(new Date()), to: new Date() })}
            >
              Resetar
            </Button>
            <Button size="sm" onClick={() => aplicar()}>
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {totalFormatado && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-sm">
          <span className="text-muted-foreground">Total investido:</span>
          <span className="font-semibold">{totalFormatado}</span>
        </div>
      )}
    </div>
  )
}
