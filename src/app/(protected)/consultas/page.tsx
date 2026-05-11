import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ConsultaFormDialog } from "@/components/consultas/consulta-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { temPermissao } from "@/lib/permissions"
import type { PapelUsuario, StatusConsulta, OrigemConsulta } from "@/lib/enums"
import { Prisma } from "@prisma/client"
import { Download, FileSpreadsheet } from "lucide-react"

type BadgeVariant = "success" | "destructive" | "warning"
const STATUS_VARIANT: Record<StatusConsulta, BadgeVariant> = {
  REALIZADA: "success",
  CANCELADA: "destructive",
  PENDENTE:  "warning",
}

const ORIGEM_STYLE: Record<string, string> = {
  FC:          "bg-green-50 text-green-700 border-green-200",
  LINK:        "bg-orange-50 text-orange-700 border-orange-200",
  TRAFEGO:     "bg-amber-50 text-amber-700 border-amber-200",
  RECORRENCIA: "bg-blue-50 text-blue-700 border-blue-200",
  REMARTIK:    "bg-purple-50 text-purple-700 border-purple-200",
  IMPULSIONAR: "bg-pink-50 text-pink-700 border-pink-200",
}

const STATUS_LABELS: Record<StatusConsulta, string> = {
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
  PENDENTE: "Pendente",
}

const ORIGEM_LABELS: Record<OrigemConsulta, string> = {
  FC: "FC",
  LINK: "Link",
  TRAFEGO: "Tráfego",
  RECORRENCIA: "Recorrência",
  REMARTIK: "Remartik",
  IMPULSIONAR: "Impulsionar",
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

interface SearchParams {
  mes?: string
  ano?: string
  status?: string
  origem?: string
  pagina?: string
}

const PAGE_SIZE = 25

export default async function ConsultasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const papel = session.user.papel as PapelUsuario
  if (!temPermissao(papel, "consultas", "view")) redirect("/dashboard?erro=sem-permissao")

  const hoje = new Date()
  const params = await searchParams
  const mes = parseInt(params.mes ?? String(hoje.getMonth() + 1))
  const ano = parseInt(params.ano ?? String(hoje.getFullYear()))
  const pagina = parseInt(params.pagina ?? "1")
  const skip = (pagina - 1) * PAGE_SIZE

  const where: Prisma.ConsultaWhereInput = {
    mes,
    ano,
    ...(params.status && params.status !== "todos" && { status: params.status as StatusConsulta }),
    ...(params.origem && params.origem !== "todos" && { origem: params.origem as OrigemConsulta }),
  }

  const [consultas, total, totalRealizado] = await Promise.all([
    prisma.consulta.findMany({
      where,
      orderBy: { dataConsulta: "desc" },
      take: PAGE_SIZE,
      skip,
      include: { lead: { select: { nome: true } } },
    }),
    prisma.consulta.count({ where }),
    prisma.consulta.aggregate({
      where: { ...where, dataPagamento: { not: null } },
      _sum: { valor: true },
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const podeEditar = temPermissao(papel, "consultas", "edit")

  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - 2 + i)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Consultas</h2>
          <p className="text-muted-foreground text-sm">
            {total} consultas | Faturamento: {formatCurrency(Number(totalRealizado._sum.valor ?? 0))}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <a
              href={`/api/exportar/consultas?mes=${mes}&ano=${ano}&status=${params.status ?? ""}&origem=${params.origem ?? ""}`}
              download
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar XLSX
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/consultas/importar">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Importar
            </Link>
          </Button>
          {podeEditar && <ConsultaFormDialog />}
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-3 flex-wrap">
        <Select name="mes" defaultValue={String(mes)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MESES.map((m, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="ano" defaultValue={String(ano)}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {anosDisponiveis.map((a) => (
              <SelectItem key={a} value={String(a)}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="status" defaultValue={params.status ?? "todos"}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="REALIZADA">Realizada</SelectItem>
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="CANCELADA">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select name="origem" defaultValue={params.origem ?? "todos"}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas origens</SelectItem>
            <SelectItem value="FC">FC</SelectItem>
            <SelectItem value="LINK">Link</SelectItem>
            <SelectItem value="TRAFEGO">Tráfego</SelectItem>
            <SelectItem value="RECORRENCIA">Recorrência</SelectItem>
            <SelectItem value="REMARTIK">Remartik</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline" size="sm">
          Filtrar
        </Button>
      </form>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {consultas.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma consulta encontrada.</p>
        )}
        {consultas.map((c) => (
          <div
            key={c.id}
            className={`rounded-lg border bg-card p-4 space-y-2 ${c.status === "CANCELADA" ? "opacity-60" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-sm leading-tight">{c.nomeCliente}</span>
              <Badge variant={STATUS_VARIANT[c.status as StatusConsulta]}>
                {STATUS_LABELS[c.status as StatusConsulta] ?? c.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${ORIGEM_STYLE[c.origem] ?? "bg-muted text-muted-foreground border-border"}`}>
                {ORIGEM_LABELS[c.origem as OrigemConsulta] ?? c.origem}
              </span>
              <span className="text-xs font-medium">{c.valor != null ? formatCurrency(Number(c.valor)) : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{formatDate(c.dataConsulta)}</span>
              {podeEditar && (
                <ConsultaFormDialog consulta={{
                  id: c.id,
                  nomeCliente: c.nomeCliente,
                  dataConsulta: c.dataConsulta,
                  dataPagamento: c.dataPagamento,
                  origem: c.origem,
                  valor: c.valor != null ? Number(c.valor) : null,
                  status: c.status,
                  observacoes: c.observacoes,
                  mes: c.mes,
                  ano: c.ano,
                  leadId: c.leadId,
                }}>
                  <Button variant="ghost" size="sm" className="h-8 px-3">Editar</Button>
                </ConsultaFormDialog>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden md:block rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="hover:bg-muted/60">
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Cliente</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Data Consulta</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Data Pagamento</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Origem</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Valor</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Lead</TableHead>
              {podeEditar && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {consultas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhuma consulta encontrada.
                </TableCell>
              </TableRow>
            )}
            {consultas.map((c) => (
              <TableRow
                key={c.id}
                className={`hover:bg-accent/50 transition-colors ${c.status === "CANCELADA" ? "opacity-60" : ""}`}
              >
                <TableCell className="font-medium">{c.nomeCliente}</TableCell>
                <TableCell>{formatDate(c.dataConsulta)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {c.dataPagamento ? formatDate(c.dataPagamento) : "—"}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${ORIGEM_STYLE[c.origem] ?? "bg-muted text-muted-foreground border-border"}`}>
                    {ORIGEM_LABELS[c.origem as OrigemConsulta] ?? c.origem}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  {c.valor != null ? formatCurrency(Number(c.valor)) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[c.status as StatusConsulta]}>
                    {STATUS_LABELS[c.status as StatusConsulta] ?? c.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {c.lead ? (
                    <Link href={`/leads/${c.leadId}`} className="hover:underline">
                      {c.lead.nome}
                    </Link>
                  ) : "—"}
                </TableCell>
                {podeEditar && (
                  <TableCell>
                    <ConsultaFormDialog consulta={{
                        id: c.id,
                        nomeCliente: c.nomeCliente,
                        dataConsulta: c.dataConsulta,
                        dataPagamento: c.dataPagamento,
                        origem: c.origem,
                        valor: c.valor != null ? Number(c.valor) : null,
                        status: c.status,
                        observacoes: c.observacoes,
                        mes: c.mes,
                        ano: c.ano,
                        leadId: c.leadId,
                      }}>
                      <Button variant="ghost" size="sm">Editar</Button>
                    </ConsultaFormDialog>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">Página {pagina} de {totalPages}</p>
          <div className="flex gap-2">
            {pagina > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`?mes=${mes}&ano=${ano}&pagina=${pagina - 1}`}>Anterior</Link>
              </Button>
            )}
            {pagina < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`?mes=${mes}&ano=${ano}&pagina=${pagina + 1}`}>Próxima</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
