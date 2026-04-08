"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface FaturamentoData {
  mes: string
  realizado: number | null
}

interface FaturamentoLineChartProps {
  data: FaturamentoData[]
}

export function FaturamentoLineChart({ data }: FaturamentoLineChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Faturamento Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#edeae8"
              vertical={false}
            />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
              }}
            />
            <Area
              type="monotone"
              dataKey="realizado"
              connectNulls={false}
              stroke="hsl(36, 55%, 45%)"
              strokeWidth={2.5}
              fill="hsl(36, 55%, 45%)"
              fillOpacity={0.12}
              dot={false}
              activeDot={{ r: 5, fill: "hsl(36, 55%, 45%)", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
