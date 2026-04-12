import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { LeadFormDialog } from "@/components/leads/lead-form-dialog"
import { ImportLeadsDialog } from "@/components/leads/import-leads-dialog"
import { LeadStatusBadge } from "@/components/leads/lead-status-badge"
import { CanalBadge } from "@/components/leads/canal-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { temPermissao } from "@/lib/permissions"
import type { PapelUsuario, CanalLead, StatusLead } from "@/lib/enums"
import { Prisma } from "@prisma/client"

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

interface SearchParams {
  q?: string
  canal?: string
  status?: string
  pagina?: string
}

const PAGE_SIZE = 20

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const papel = session.user.papel as PapelUsuario
  if (!temPermissao(papel, "leads", "view")) redirect("/dashboard?erro=sem-permissao")

  const params = await searchParams
  const pagina = parseInt(params.pagina ?? "1")
  const skip = (pagina - 1) * PAGE_SIZE

  const where: Prisma.LeadWhereInput = {
    ...(params.q && {
      OR: [
        { nome: { contains: params.q } },
        { codigoWhatsApp: { contains: params.q } },
      ],
    }),
    ...(params.canal && params.canal !== "todos" && { canal: params.canal }),
    ...(params.status && params.status !== "todos" && { status: params.status }),
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { dataUltimaInteracao: "desc" },
      take: PAGE_SIZE,
      skip,
      include: { usuario: { select: { nome: true } } },
    }),
    prisma.lead.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const podeEditar = temPermissao(papel, "leads", "edit")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leads</h2>
          <p className="text-muted-foreground text-sm">{total} leads encontrados</p>
        </div>
        {podeEditar && (
          <div className="flex gap-2">
            <ImportLeadsDialog />
            <LeadFormDialog />
          </div>
        )}
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-3 flex-wrap">
        <Input
          name="q"
          placeholder="Buscar por nome ou WhatsApp..."
          defaultValue={params.q}
          className="max-w-xs"
        />
        <Select name="canal" defaultValue={params.canal ?? "todos"}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os canais</SelectItem>
            {Object.entries(CANAL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="status" defaultValue={params.status ?? "todos"}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="ABORDAGEM">Abordagem</SelectItem>
            <SelectItem value="EM_CONVERSA">Em conversa</SelectItem>
            <SelectItem value="AGENDADO">Agendado</SelectItem>
            <SelectItem value="CONVERTIDO">Convertido</SelectItem>
            <SelectItem value="CONSULTA_FECHADA">Consulta fechada</SelectItem>
            <SelectItem value="FECHOU">Fechou</SelectItem>
            <SelectItem value="PAROU_DE_INTERAGIR">Parou de interagir</SelectItem>
            <SelectItem value="LEAD_PERDIDO">Lead perdido</SelectItem>
            <SelectItem value="CANCELADO">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline" size="sm">
          Filtrar
        </Button>
      </form>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="hover:bg-muted/60">
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Nome</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Canal</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">WhatsApp</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Atendente</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Última Interação</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum lead encontrado.
                </TableCell>
              </TableRow>
            )}
            {leads.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-accent/50 transition-colors">
                <TableCell className="font-medium">{lead.nome}</TableCell>
                <TableCell>
                  <CanalBadge canal={lead.canal} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {lead.codigoWhatsApp ?? "—"}
                </TableCell>
                <TableCell>
                  <LeadStatusBadge status={lead.status as import("@/lib/enums").StatusLead} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {lead.usuario.nome}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(lead.dataUltimaInteracao)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/leads/${lead.id}`}>Ver</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Página {pagina} de {totalPages}
          </p>
          <div className="flex gap-2">
            {pagina > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`?pagina=${pagina - 1}&q=${params.q ?? ""}&canal=${params.canal ?? ""}&status=${params.status ?? ""}`}>
                  Anterior
                </Link>
              </Button>
            )}
            {pagina < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`?pagina=${pagina + 1}&q=${params.q ?? ""}&canal=${params.canal ?? ""}&status=${params.status ?? ""}`}>
                  Próxima
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
