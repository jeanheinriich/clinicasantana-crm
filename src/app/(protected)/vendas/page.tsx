import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { temPermissao } from "@/lib/permissions"
import type { PapelUsuario } from "@/lib/enums"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate, formatCurrency } from "@/lib/utils"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { VendaFormDialog } from "@/components/vendas/venda-form-dialog"
import { DeleteVendaButton } from "@/components/vendas/delete-venda-button"
import { PaginationNav } from "@/components/ui/pagination-nav"
import { ShoppingBag, DollarSign, TrendingDown, Users } from "lucide-react"

const PAGE_SIZE = 20

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

type BadgeVariant = "success" | "destructive" | "warning"
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  REALIZADA: "success",
  CANCELADA: "destructive",
  PENDENTE:  "warning",
}
const STATUS_LABELS: Record<string, string> = {
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
  PENDENTE:  "Pendente",
}

interface SearchParams { mes?: string; ano?: string; status?: string; pagina?: string }

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const papel = session.user.papel as PapelUsuario
  if (!temPermissao(papel, "vendas", "view")) redirect("/dashboard?erro=sem-permissao")

  const hoje = new Date()
  const params = await searchParams
  const mes    = parseInt(params.mes ?? String(hoje.getMonth() + 1))
  const ano    = parseInt(params.ano ?? String(hoje.getFullYear()))
  const pagina = Math.max(1, parseInt(params.pagina ?? "1", 10))
  const skip   = (pagina - 1) * PAGE_SIZE

  const where = {
    mes,
    ano,
    ...(params.status && params.status !== "todos" && { status: params.status }),
  }

  const [vendasRaw, total, totais, consultas] = await Promise.all([
    prisma.venda.findMany({
      where,
      orderBy: { dataVenda: "desc" },
      take: PAGE_SIZE,
      skip,
      include: { consulta: { select: { nomeCliente: true, origem: true } } },
    }),
    prisma.venda.count({ where }),
    prisma.venda.aggregate({
      where: { mes, ano },
      _sum: { valor: true },
      _count: true,
    }),
    prisma.consulta.findMany({
      orderBy: { dataConsulta: "desc" },
      take: 300,
      select: { id: true, nomeCliente: true, dataConsulta: true, origem: true },
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const podeEditar = temPermissao(papel, "vendas", "edit")

  // Serializar para objetos simples — Prisma retorna Decimal que não pode
  // ser passado a Client Components no Next.js
  const vendas = vendasRaw.map((v) => ({
    id:          v.id,
    consultaId:  v.consultaId,
    nomeCliente: v.consulta.nomeCliente,
    origem:      v.consulta.origem,
    valor:       Number(v.valor),
    dataVenda:   v.dataVenda,
    status:      v.status,
    observacao:  v.observacao,
  }))

  const totalValor  = Number(totais._sum.valor ?? 0)
  const totalCount  = totais._count
  const ticketMedio = totalCount > 0 ? totalValor / totalCount : null
  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - 2 + i)

  const qtdNovos   = vendas.filter((v) => v.origem !== "RECORRENCIA").length
  const qtdRec     = vendas.filter((v) => v.origem === "RECORRENCIA").length
  const valorNovos = vendas.filter((v) => v.origem !== "RECORRENCIA").reduce((s, v) => s + v.valor, 0)
  const valorRec   = vendas.filter((v) => v.origem === "RECORRENCIA").reduce((s, v) => s + v.valor, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            Vendas
          </h2>
          <p className="text-muted-foreground text-sm">
            {total} venda{total !== 1 ? "s" : ""} em {MESES[mes - 1].toLowerCase()} / {ano}
          </p>
        </div>
        {podeEditar && <VendaFormDialog consultas={consultas} />}
      </div>

      {/* Filtros */}
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
        <Button type="submit" variant="outline" size="sm">Filtrar</Button>
      </form>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          title="Total de Vendas"
          value={String(totalCount)}
          icon={ShoppingBag}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <KpiCard
          title="Valor Total"
          value={formatCurrency(totalValor)}
          icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <KpiCard
          title="Ticket Médio"
          value={ticketMedio != null ? formatCurrency(ticketMedio) : "—"}
          icon={TrendingDown}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
        />
        <KpiCard
          title="Novos / Recorrentes"
          value={`${qtdNovos} / ${qtdRec}`}
          subtitle={`${formatCurrency(valorNovos)} / ${formatCurrency(valorRec)}`}
          icon={Users}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {vendas.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma venda encontrada.</p>
        )}
        {vendas.map((v) => (
          <div key={v.id} className={`rounded-lg border bg-card p-4 space-y-2 ${v.status === "CANCELADA" ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-sm leading-tight">{v.nomeCliente}</span>
              <Badge variant={STATUS_VARIANT[v.status] ?? "secondary"}>
                {STATUS_LABELS[v.status] ?? v.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {v.origem === "RECORRENCIA" ? "Recorrente" : "Novo"}
              </Badge>
              <span className="text-sm font-medium">{formatCurrency(v.valor)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{formatDate(v.dataVenda)}</span>
              {podeEditar && (
                <div className="flex gap-1">
                  <VendaFormDialog
                    consultas={consultas}
                    venda={{ id: v.id, consultaId: v.consultaId, valor: v.valor, dataVenda: v.dataVenda, status: v.status, observacao: v.observacao }}
                  >
                    <Button variant="ghost" size="sm" className="h-8 px-3">Editar</Button>
                  </VendaFormDialog>
                  <DeleteVendaButton id={v.id} />
                </div>
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
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Data Venda</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground text-right">Valor</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Obs</TableHead>
              {podeEditar && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma venda encontrada.
                </TableCell>
              </TableRow>
            )}
            {vendas.map((v) => (
              <TableRow
                key={v.id}
                className={`hover:bg-accent/50 transition-colors ${v.status === "CANCELADA" ? "opacity-60" : ""}`}
              >
                <TableCell className="font-medium">{v.nomeCliente}</TableCell>
                <TableCell>{formatDate(v.dataVenda)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {v.origem === "RECORRENCIA" ? "Recorrente" : "Novo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(v.valor)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[v.status] ?? "secondary"}>
                    {STATUS_LABELS[v.status] ?? v.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate" title={v.observacao ?? undefined}>
                  {v.observacao ?? "—"}
                </TableCell>
                {podeEditar && (
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <VendaFormDialog
                        consultas={consultas}
                        venda={{ id: v.id, consultaId: v.consultaId, valor: v.valor, dataVenda: v.dataVenda, status: v.status, observacao: v.observacao }}
                      >
                        <Button variant="ghost" size="sm">Editar</Button>
                      </VendaFormDialog>
                      <DeleteVendaButton id={v.id} />
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <PaginationNav
          pagina={pagina}
          totalPages={totalPages}
          buildHref={(p) => `?mes=${mes}&ano=${ano}&pagina=${p}`}
        />
      )}
    </div>
  )
}
