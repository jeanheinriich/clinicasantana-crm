import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { LeadStatusBadge } from "@/components/leads/lead-status-badge"
import { CanalBadge } from "@/components/leads/canal-badge"
import { LeadFormDialog } from "@/components/leads/lead-form-dialog"
import { LeadHistoryTimeline } from "@/components/leads/lead-history-timeline"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, formatDateTime } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { temPermissao } from "@/lib/permissions"
import type { PapelUsuario, CanalLead } from "@/lib/enums"

const CANAL_LABELS: Record<CanalLead, string> = {
  IMPULSIONAR:      "Impulsionar",
  REMARTIK:         "Remartik",
  TRAFEGO:          "Tráfego",
  FC:               "FC",
  LINK:             "Link",
  FABRICA_INSTAGRAM: "Fáb. Instagram",
  TURBINAR:         "Turbinar",
  OUTRO:            "Outro",
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const papel = session.user.papel as PapelUsuario
  if (!temPermissao(papel, "leads", "view")) redirect("/dashboard?erro=sem-permissao")

  const { id } = await params
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      usuario: { select: { nome: true } },
      origemCampanha: { select: { nome: true } },
      interacoes: { orderBy: { criadoEm: "desc" } },
      consultas: { orderBy: { dataConsulta: "desc" } },
    },
  })

  if (!lead) notFound()

  const podeEditar = temPermissao(papel, "leads", "edit")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/leads">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{lead.nome}</h2>
          <div className="flex items-center gap-2 mt-1">
            <LeadStatusBadge status={lead.status as import("@/lib/enums").StatusLead} />
            <CanalBadge canal={lead.canal} />
          </div>
        </div>
        {podeEditar && <LeadFormDialog lead={lead} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Atendente</p>
                <p className="font-medium">{lead.usuario.nome}</p>
              </div>
              <div>
                <p className="text-muted-foreground">WhatsApp</p>
                <p className="font-medium">{lead.codigoWhatsApp ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Canal</p>
                <p className="font-medium">{CANAL_LABELS[lead.canal as CanalLead] ?? lead.canal}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Campanha de Origem</p>
                <p className="font-medium">{lead.origemCampanha?.nome ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Data de Criação</p>
                <p className="font-medium">{formatDateTime(lead.dataCriacao)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Última Interação</p>
                <p className="font-medium">{formatDateTime(lead.dataUltimaInteracao)}</p>
              </div>
              {lead.observacoes && (
                <div>
                  <p className="text-muted-foreground">Observações</p>
                  <p className="whitespace-pre-wrap">{lead.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consultas */}
          {lead.consultas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Consultas Vinculadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lead.consultas.map((c) => (
                  <div key={c.id} className="text-sm border rounded p-2">
                    <p className="font-medium">{c.nomeCliente}</p>
                    <p className="text-muted-foreground">{formatDate(c.dataConsulta)}</p>
                    <Badge
                    variant={c.status === "REALIZADA" ? "success" : c.status === "CANCELADA" ? "destructive" : "warning"}
                    className="text-xs mt-1"
                  >
                    {c.status}
                  </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <LeadHistoryTimeline leadId={lead.id} interacoes={lead.interacoes} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
