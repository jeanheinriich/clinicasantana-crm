import { Badge } from "@/components/ui/badge"
import type { StatusLead } from "@/lib/enums"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "pending"

const STATUS_CONFIG: Record<StatusLead, { label: string; variant: BadgeVariant }> = {
  ABORDAGEM:          { label: "Abordagem",          variant: "pending" },
  EM_CONVERSA:        { label: "Em conversa",         variant: "warning" },
  AGENDADO:           { label: "Agendado",            variant: "info" },
  CONVERTIDO:         { label: "Convertido",          variant: "success" },
  CONSULTA_FECHADA:   { label: "Consulta fechada",    variant: "success" },
  FECHOU:             { label: "Fechou",              variant: "secondary" },
  PAROU_DE_INTERAGIR: { label: "Parou de interagir",  variant: "secondary" },
  LEAD_PERDIDO:       { label: "Lead perdido",        variant: "destructive" },
  CANCELADO:          { label: "Cancelado",           variant: "destructive" },
}

export function LeadStatusBadge({ status }: { status: StatusLead }) {
  const config = STATUS_CONFIG[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
