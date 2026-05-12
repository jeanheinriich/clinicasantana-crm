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
import { formatCurrency, formatDate } from "@/lib/utils"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Megaphone, DollarSign, Eye, MousePointerClick, TrendingDown, Play, UserPlus } from "lucide-react"
import { PaginationNav } from "@/components/ui/pagination-nav"
import { SyncButton } from "@/components/ui/sync-button"
import { PeriodoFilter } from "@/components/campanhas/periodo-filter"
import { startOfMonth, format } from "date-fns"
import type { Prisma } from "@prisma/client"

const PAGE_SIZE = 10

function buildWhere(de: string, ate: string): Prisma.MetaCampanhaWhereInput {
  const from = new Date(de)
  const to   = new Date(ate)
  to.setHours(23, 59, 59, 999)
  return {
    dataInicio: { lte: to },
    OR: [
      { dataFim: { gte: from } },
      { dataFim: null },
    ],
  }
}

export default async function CampanhasPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string; pagina?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const papel = session.user.papel as PapelUsuario
  if (!temPermissao(papel, "campanhas", "view")) redirect("/dashboard?erro=sem-permissao")

  const params  = await searchParams
  const deParam  = params.de  ?? format(startOfMonth(new Date()), "yyyy-MM-dd")
  const ateParam = params.ate ?? format(new Date(), "yyyy-MM-dd")
  const pagina   = Math.max(1, parseInt(params.pagina ?? "1", 10))

  const where = buildWhere(deParam, ateParam)

  const [campanhas, total, totais, totalLeads] = await Promise.all([
    prisma.metaCampanha.findMany({
      where,
      orderBy: { investimento: "desc" },
      take: PAGE_SIZE,
      skip: (pagina - 1) * PAGE_SIZE,
    }),
    prisma.metaCampanha.count({ where }),
    prisma.metaCampanha.aggregate({
      where,
      _sum: { investimento: true, alcance: true, cliques: true, vistas: true, seguidores: true },
    }),
    prisma.lead.count({
      where: {
        dataCriacao: { gte: new Date(deParam), lte: new Date(ateParam) },
      },
    }),
  ])

  const totalPages        = Math.ceil(total / PAGE_SIZE)
  const totalInvestimento = Number(totais._sum.investimento ?? 0)
  const totalAlcance      = totais._sum.alcance ?? 0
  const totalCliques      = totais._sum.cliques ?? 0
  const totalVistas       = totais._sum.vistas ?? 0
  const totalSeguidores   = totais._sum.seguidores ?? 0
  const cpl               = totalLeads > 0 ? totalInvestimento / totalLeads : null
  const custoVisita       = totalVistas > 0 ? totalInvestimento / totalVistas : null
  const custoSeguidor     = totalSeguidores > 0 ? totalInvestimento / totalSeguidores : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Campanhas Meta Ads
          </h2>
          <p className="text-muted-foreground text-sm">
            {total} campanha{total !== 1 ? "s" : ""} no período
          </p>
        </div>
        {papel === "ADMIN" && (
          <SyncButton endpoint="/api/integracoes/meta/sync" label="Sincronizar" />
        )}
      </div>

      {/* Filtro de período */}
      <PeriodoFilter deParam={deParam} ateParam={ateParam} totalInvestimento={totalInvestimento} />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Investimento Total"
          value={formatCurrency(totalInvestimento)}
          icon={DollarSign}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <KpiCard
          title="Alcance Total"
          value={totalAlcance.toLocaleString("pt-BR")}
          icon={Eye}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <KpiCard
          title="Cliques Totais"
          value={totalCliques.toLocaleString("pt-BR")}
          icon={MousePointerClick}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
        />
        <KpiCard
          title="CPL — Período"
          value={cpl != null ? formatCurrency(cpl) : "Sem dados"}
          icon={TrendingDown}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          subtitle="Investimento ÷ leads do período"
        />
        <KpiCard
          title="Visitas ao Perfil"
          value={totalVistas > 0 ? totalVistas.toLocaleString("pt-BR") : "Sem dados"}
          icon={Play}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          subtitle={custoVisita != null ? `Custo/visita: ${formatCurrency(custoVisita)}` : undefined}
        />
        <KpiCard
          title="Seguidores Ganhos"
          value={totalSeguidores > 0 ? totalSeguidores.toLocaleString("pt-BR") : "Sem dados"}
          icon={UserPlus}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          subtitle={custoSeguidor != null ? `Custo/seguidor: ${formatCurrency(custoSeguidor)}` : undefined}
        />
      </div>

      {/* Tabela de campanhas */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Investimento</TableHead>
              <TableHead className="text-right">Alcance</TableHead>
              <TableHead className="text-right">Cliques</TableHead>
              <TableHead className="text-right">Impressões</TableHead>
              <TableHead>Início</TableHead>
              <TableHead className="text-right">Dias</TableHead>
              <TableHead className="text-right">CPL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campanhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Nenhuma campanha no período selecionado.
                </TableCell>
              </TableRow>
            )}
            {campanhas.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium max-w-[200px] truncate" title={c.nome}>
                  {c.nome}
                </TableCell>
                <TableCell>
                  <Badge variant={c.status === "ACTIVE" ? "success" : "secondary"}>
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(Number(c.investimento))}
                </TableCell>
                <TableCell className="text-right">
                  {c.alcance.toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  {c.cliques.toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  {c.impressoes.toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.dataInicio ? formatDate(c.dataInicio) : "—"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {c.dataInicio && c.dataFim
                    ? Math.ceil((c.dataFim.getTime() - c.dataInicio.getTime()) / 86400000)
                    : c.dataFim ? "—" : "Ativo"}
                </TableCell>
                <TableCell className="text-right">
                  {c.leadsGerados > 0
                    ? formatCurrency(Number(c.investimento) / c.leadsGerados)
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <PaginationNav
          pagina={pagina}
          totalPages={totalPages}
          buildHref={(p) => `?de=${deParam}&ate=${ateParam}&pagina=${p}`}
        />
      )}
    </div>
  )
}
