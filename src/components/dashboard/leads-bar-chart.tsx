"use client"

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LeadsData {
  canal: string
  quantidade: number
}

interface LeadsBarChartProps {
  data: LeadsData[]
}

const CORES: Record<string, string> = {
  "Impulsionar": "hsl(210, 65%, 52%)",
  "Remartik":    "hsl(258, 55%, 58%)",
  "Tráfego":     "hsl(36,  55%, 45%)",
  "FC":          "hsl(142, 45%, 42%)",
  "Link":        "hsl(20,  60%, 52%)",
  "Fáb. Inst.":  "hsl(190, 50%, 45%)",
  "Turbinar":    "hsl(180, 35%, 42%)",
  "Outro":       "hsl(25,  8%,  56%)",
}

export function LeadsBarChart({ data }: LeadsBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Leads por Canal (mês atual)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#edeae8" />
            <XAxis dataKey="canal" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(value) => [value, "Leads"]}
            />
            <Bar dataKey="quantidade" radius={[4, 4, 0, 0]} name="Leads">
              {data.map((entry) => (
                <Cell
                  key={entry.canal}
                  fill={CORES[entry.canal] ?? "hsl(var(--chart-1))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
