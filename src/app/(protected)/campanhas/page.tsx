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
import { formatCurrency, formatDate } from "@/lib/utils"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Megaphone, RefreshCw, DollarSign, Eye, MousePointerClick, TrendingDown } from "lucide-react"
import { calcularCPLPorCanal } from "@/lib/calcula-cpl"

export default async function CampanhasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const papel = session.user.papel as PapelUsuario
  if (!temPermissao(papel, "campanhas", "view")) redirect("/dashboard?erro=sem-permissao")

  const hoje = new Date()
  const mes  = hoje.getMonth() + 1
  const ano  = hoje.getFullYear()

  const [campanhas, totais, cpl] = await Promise.all([
    prisma.metaCampanha.findMany({
      orderBy: { sincronizadoEm: "desc" },
    }),
    prisma.metaCampanha.aggregate({
      _sum: {
        investimento: true,
        alcance:      true,
        cliques:      true,
      },
    }),
    calcularCPLPorCanal(mes, ano),
  ])

  const totalInvestimento = Number(totais._sum.investimento ?? 0)
  const totalAlcance      = totais._sum.alcance  ?? 0
  const totalCliques      = totais._sum.cliques  ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Campanhas Meta Ads
          </h2>
          <p className="text-muted-foreground text-sm">
            {campanhas.length} campanhas sincronizadas
          </p>
        </div>
        {papel === "ADMIN" && (
          <form action="/api/integracoes/meta/sync" method="POST">
            <Button variant="outline" size="sm" type="submit">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar
            </Button>
          </form>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          title="CPL — Mês Atual"
          value={cpl.cplGeral != null ? formatCurrency(cpl.cplGeral) : "Sem dados"}
          icon={TrendingDown}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          subtitle="Investimento ÷ leads do mês"
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {campanhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma campanha sincronizada.{" "}
                  <a href="/integracoes/meta" className="underline">
                    Conecte o Meta Ads
                  </a>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
