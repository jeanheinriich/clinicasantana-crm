import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  iconBg?: string
  iconColor?: string
  trend?: "up" | "down" | "neutral"
  className?: string
}

export function KpiCard({ title, value, subtitle, icon: Icon, iconBg, iconColor, trend, className }: KpiCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`rounded-full p-2 ${iconBg ?? "bg-primary/10"}`}>
          <Icon className={`h-4 w-4 ${iconColor ?? "text-primary"}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend === "up" && (
          <p className="text-xs mt-1 font-medium" style={{ color: "hsl(142, 45%, 40%)" }}>acima da meta</p>
        )}
        {trend === "down" && (
          <p className="text-xs mt-1 font-medium" style={{ color: "hsl(20, 60%, 48%)" }}>abaixo da meta</p>
        )}
      </CardContent>
    </Card>
  )
}
