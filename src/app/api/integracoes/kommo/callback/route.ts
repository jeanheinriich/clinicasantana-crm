import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    redirect(`/integracoes/kommo?erro=${encodeURIComponent(error)}`)
  }

  if (!code) {
    redirect("/integracoes/kommo?erro=codigo_ausente")
  }

  const subdomain   = process.env.KOMMO_SUBDOMAIN
  const clientId    = process.env.KOMMO_CLIENT_ID
  const clientSecret = process.env.KOMMO_CLIENT_SECRET
  const baseUrl     = process.env.NEXT_PUBLIC_BASE_URL

  if (!subdomain || !clientId || !clientSecret || !baseUrl) {
    redirect("/integracoes/kommo?erro=variaveis_nao_configuradas")
  }

  try {
    const res = await fetch(
      `https://${subdomain}.kommo.com/oauth2/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:     clientId,
          client_secret: clientSecret,
          grant_type:    "authorization_code",
          code,
          redirect_uri:  `${baseUrl}/api/integracoes/kommo/callback`,
        }),
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const msg = (err as { hint?: string; title?: string }).hint
        ?? (err as { hint?: string; title?: string }).title
        ?? "Falha ao trocar código por token"
      redirect(`/integracoes/kommo?erro=${encodeURIComponent(msg)}`)
    }

    const data = await res.json() as {
      access_token:  string
      refresh_token: string
      expires_in:    number
    }

    await prisma.integracaoConfig.upsert({
      where:  { servico: "KOMMO" },
      create: {
        servico:      "KOMMO",
        accessToken:  data.access_token,
        refreshToken: data.refresh_token,
        expiresAt:    new Date(Date.now() + data.expires_in * 1000),
      },
      update: {
        accessToken:  data.access_token,
        refreshToken: data.refresh_token,
        expiresAt:    new Date(Date.now() + data.expires_in * 1000),
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido"
    redirect(`/integracoes/kommo?erro=${encodeURIComponent(msg)}`)
  }

  redirect("/integracoes/kommo?sucesso=conectado")
}
