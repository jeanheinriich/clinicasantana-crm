import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { temPermissao } from "@/lib/permissions"
import type { PapelUsuario } from "@/lib/enums"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDateTime } from "@/lib/utils"
import { Plug, RefreshCw } from "lucide-react"

interface SearchParams { sucesso?: string; erro?: string; }

const SUCESSO_MSG: Record<string, string> = {
  "conectado":         "Kommo conectado com sucesso!",
  "webhook-registrado": "Webhook registrado no Kommo com sucesso!",
}

export default async function KommoIntegracaoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const papel = session.user.papel as PapelUsuario
  if (!temPermissao(papel, "integracoes", "view")) redirect("/dashboard?erro=sem-permissao")

  const params = await searchParams
  const config = await prisma.integracaoConfig.findUnique({ where: { servico: "KOMMO" } })

  const isConnected = !!config?.accessToken
  const subdomain = process.env.KOMMO_SUBDOMAIN
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  const clientId = process.env.KOMMO_CLIENT_ID

  const authUrl = subdomain && clientId
    ? `https://${subdomain}.kommo.com/oauth?client_id=${clientId}&state=kommo_auth&mode=post_message&redirect_uri=${encodeURIComponent(`${baseUrl}/api/integracoes/kommo/callback`)}`
    : null

  const extraData = config?.extraData as Record<string, unknown> | null
  const lastPollAt = extraData?.lastPollAt ? new Date(String(extraData.lastPollAt)) : null
  const webhookRegistrado = extraData?.webhookRegistrado === true

  const diasParaExpirar = config?.expiresAt
    ? Math.floor((config.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Plug className="h-6 w-6" />
          Integração Kommo
        </h2>
        <p className="text-muted-foreground text-sm">
          Sincronize leads e status do funil de vendas do Kommo
        </p>
      </div>

      {params.sucesso && (
        <Alert style={{ borderColor: "var(--status-ok-border)", backgroundColor: "var(--status-ok-bg)", color: "var(--status-ok)" }}>
          <AlertDescription>{SUCESSO_MSG[params.sucesso] ?? "Operação realizada com sucesso!"}</AlertDescription>
        </Alert>
      )}
      {params.erro && (
        <Alert variant="destructive">
          <AlertDescription>Erro: {params.erro}</AlertDescription>
        </Alert>
      )}
      {diasParaExpirar !== null && diasParaExpirar < 7 && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Token do Kommo expira em {diasParaExpirar} dia{diasParaExpirar !== 1 ? "s" : ""}.</strong>{" "}
            Reconecte a integração antes que o polling pare de funcionar.
          </AlertDescription>
        </Alert>
      )}

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
              <form action="/api/integracoes/kommo/poll" method="POST">
                <Button variant="outline" size="sm" type="submit">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar Agora
                </Button>
              </form>
            ) : (
              authUrl ? (
                <Button size="sm" asChild>
                  <a href={authUrl}>Conectar Kommo</a>
                </Button>
              ) : (
                <Badge variant="destructive">Variáveis Kommo não configuradas</Badge>
              )
            )}
          </div>

          {lastPollAt && (
            <p className="text-xs text-muted-foreground">
              Último polling: {formatDateTime(lastPollAt)}
            </p>
          )}
          {config?.expiresAt && (
            <p className="text-xs text-muted-foreground">
              Token expira em: {formatDateTime(config.expiresAt)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Webhook em Tempo Real</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: webhookRegistrado ? "var(--status-ok)" : "var(--muted-foreground)" }}
              />
              <span className="text-sm font-medium">
                {webhookRegistrado ? "Webhook ativo" : "Webhook não registrado"}
              </span>
            </div>
            {isConnected && papel === "ADMIN" && (
              <form action="/api/integracoes/kommo/registrar-webhook" method="POST">
                <Button variant="outline" size="sm" type="submit">
                  {webhookRegistrado ? "Re-registrar" : "Registrar Webhook"}
                </Button>
              </form>
            )}
          </div>
          <div className="bg-muted rounded p-3 font-mono text-xs break-all text-muted-foreground">
            {baseUrl}/api/webhooks/kommo
          </div>
          <p className="text-xs text-muted-foreground">
            Eventos: <strong>leads.add</strong>, <strong>leads.update</strong>,{" "}
            <strong>leads.status</strong>, <strong>notes.add</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
