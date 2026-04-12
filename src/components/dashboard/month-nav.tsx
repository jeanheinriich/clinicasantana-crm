import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const MESES_ABREV = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]

interface MonthNavProps {
  mes: number
  ano: number
}

export function MonthNav({ mes, ano }: MonthNavProps) {
  const hoje = new Date()
  const isCurrentMonth = mes === hoje.getMonth() + 1 && ano === hoje.getFullYear()

  const prevMes = mes === 1 ? 12 : mes - 1
  const prevAno = mes === 1 ? ano - 1 : ano
  const nextMes = mes === 12 ? 1 : mes + 1
  const nextAno = mes === 12 ? ano + 1 : ano

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href={`/dashboard?mes=${prevMes}&ano=${prevAno}`}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div className="text-center leading-none min-w-[40px]">
        <p className="text-sm font-semibold">{MESES_ABREV[mes - 1]}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{ano}</p>
      </div>
      {isCurrentMonth ? (
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
          <ChevronRight className="h-4 w-4 opacity-30" />
        </Button>
      ) : (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={`/dashboard?mes=${nextMes}&ano=${nextAno}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  )
}
