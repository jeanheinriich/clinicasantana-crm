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
import { Megaphone, RefreshCw } from "lucide-react"

interface SearchParams { sucesso?: string; erro?: string }

export default async function MetaIntegracaoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const papel = session.user.papel as PapelUsuario
  if (!temPermissao(papel, "integracoes", "view")) redirect("/dashboard?erro=sem-permissao")

  const params = await searchParams

  const [config, campanhas] = await Promise.all([
    prisma.integracaoConfig.findUnique({ where: { servico: "META" } }),
    prisma.metaCampanha.findMany({
      orderBy: { sincronizadoEm: "desc" },
      take: 20,
    }),
  ])

  const isConnected = !!config?.accessToken
  const metaAppId = process.env.META_APP_ID
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  const authUrl = metaAppId
    ? `https://www.facebook.com/v19.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(`${baseUrl}/api/integracoes/meta/callback`)}&scope=ads_read,pages_read_engagement&response_type=code`
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
        <Alert style={{ borderColor: "hsl(var(--status-ok-border))", backgroundColor: "hsl(var(--status-ok-bg))", color: "hsl(var(--status-ok))" }}>
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
                style={{ backgroundColor: isConnected ? "hsl(var(--status-ok))" : "hsl(var(--destructive))" }}
              />
              <span className="text-sm font-medium">
                {isConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
            {isConnected ? (
              <div className="flex gap-2">
                <form action="/api/integracoes/meta/sync" method="POST">
                  <Button variant="outline" size="sm" type="submit">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sincronizar Agora
                  </Button>
                </form>
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
      {campanhas.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Campanhas Sincronizadas</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-right">Alcance</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">CPL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campanhas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
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
                    <TableCell className="text-right">{c.leadsGerados}</TableCell>
                    <TableCell className="text-right">
                      {c.custoPorLead != null ? formatCurrency(Number(c.custoPorLead)) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
