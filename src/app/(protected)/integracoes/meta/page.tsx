import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { temPermissao } from "@/lib/permissions"
import type { PapelUsuario } from "@/lib/enums"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDateTime, formatCurrency } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Megaphone } from "lucide-react"
import { SyncButton } from "@/components/ui/sync-button"
import { PaginationNav } from "@/components/ui/pagination-nav"

const PAGE_SIZE = 6

interface SearchParams { sucesso?: string; erro?: string; pagina?: string }

export default async function MetaIntegracaoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const pagina = Math.max(1, parseInt(params.pagina ?? "1"))
  const skip = (pagina - 1) * PAGE_SIZE

  const [session, config, campanhas, totalCampanhas] = await Promise.all([
    auth(),
    prisma.integracaoConfig.findUnique({ where: { servico: "META" } }),
    prisma.metaCampanha.findMany({
      orderBy: { investimento: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    prisma.metaCampanha.count(),
  ])

  if (!session?.user) redirect("/login")
  const papel = session.user.papel as PapelUsuario
  if (!temPermissao(papel, "integracoes", "view")) redirect("/dashboard?erro=sem-permissao")

  const totalPages = Math.ceil(totalCampanhas / PAGE_SIZE)
  const isConnected = !!config?.accessToken
  const metaAppId = process.env.META_APP_ID
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  const authUrl = metaAppId
    ? `https://www.facebook.com/v21.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(`${baseUrl}/api/integracoes/meta/callback`)}&scope=ads_read,pages_read_engagement,instagram_manage_insights,instagram_basic&response_type=code`
    : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          Integração Meta Ads
        </h2>
        <p className="text-muted-foreground text-sm">
          Sincronize campanhas e leads do Meta Ads automaticamente
        </p>
      </div>

      {params.sucesso && (
        <Alert style={{ borderColor: "var(--status-ok-border)", backgroundColor: "var(--status-ok-bg)", color: "var(--status-ok)" }}>
          <AlertDescription>Conta Meta conectada com sucesso!</AlertDescription>
        </Alert>
      )}
      {params.erro && (
        <Alert variant="destructive">
          <AlertDescription>Erro: {params.erro}</AlertDescription>
        </Alert>
      )}

      {/* Status da conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status da Conexão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: isConnected ? "var(--status-ok)" : "var(--destructive)" }}
              />
              <span className="text-sm font-medium">
                {isConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
            {isConnected ? (
              <div className="flex gap-2">
                <SyncButton endpoint="/api/integracoes/meta/sync" />
                {authUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={authUrl}>Reconectar</a>
                  </Button>
                )}
              </div>
            ) : (
              authUrl ? (
                <Button size="sm" asChild>
                  <a href={authUrl}>Conectar Meta Ads</a>
                </Button>
              ) : (
                <Badge variant="destructive">META_APP_ID não configurado</Badge>
              )
            )}
          </div>
          {config?.expiresAt && (
            <p className="text-xs text-muted-foreground">
              Token expira em: {formatDateTime(config.expiresAt)}
            </p>
          )}
          {config?.atualizadoEm && (
            <p className="text-xs text-muted-foreground">
              Última sincronização: {formatDateTime(config.atualizadoEm)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Campanhas */}
      {totalCampanhas > 0 && (
        <div>
          <h3 className="font-semibold mb-3">
            Campanhas Sincronizadas
            <span className="ml-2 text-sm font-normal text-muted-foreground">({totalCampanhas})</span>
          </h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-right">Alcance</TableHead>
                  <TableHead className="text-right">Visualizações</TableHead>
                  <TableHead className="text-right">Seguidores</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">CPL</TableHead>
                  <TableHead>Sincronizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campanhas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium max-w-[180px] truncate" title={c.nome}>
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
                      {c.vistas > 0 ? c.vistas.toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.seguidores > 0 ? c.seguidores.toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-right">{c.leadsGerados > 0 ? c.leadsGerados : "—"}</TableCell>
                    <TableCell className="text-right">
                      {c.custoPorLead != null ? formatCurrency(Number(c.custoPorLead)) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDateTime(c.sincronizadoEm)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationNav
            pagina={pagina}
            totalPages={totalPages}
            buildHref={(p) => `?pagina=${p}`}
          />
        </div>
      )}
    </div>
  )
}
