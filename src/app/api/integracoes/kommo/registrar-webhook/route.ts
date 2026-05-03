import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const WEBHOOK_EVENTS = ["add_lead", "update_lead", "status_lead", "add_note"]

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  if (!token || token.papel !== "ADMIN") {
    return NextResponse.redirect(new URL("/integracoes/kommo?erro=sem-permissao", req.url))
  }

  const config = await prisma.integracaoConfig.findUnique({ where: { servico: "KOMMO" } })
  if (!config?.accessToken) {
    return NextResponse.redirect(new URL("/integracoes/kommo?erro=token-nao-configurado", req.url))
  }

  const subdomain = process.env.KOMMO_SUBDOMAIN
  const baseUrl   = process.env.NEXT_PUBLIC_BASE_URL
  if (!subdomain || !baseUrl) {
    return NextResponse.redirect(new URL("/integracoes/kommo?erro=variaveis-nao-configuradas", req.url))
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const res = await fetch(`https://${subdomain}.kommo.com/api/v4/webhooks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        { url: `${baseUrl}/api/webhooks/kommo`, events: WEBHOOK_EVENTS },
      ]),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const msg = (err as { detail?: string })?.detail ?? "erro-kommo"
      return NextResponse.redirect(
        new URL(`/integracoes/kommo?erro=${encodeURIComponent(msg)}`, req.url)
      )
    }

    const extraData = (config.extraData as Record<string, unknown> | null) ?? {}
    await prisma.integracaoConfig.update({
      where: { servico: "KOMMO" },
      data: { extraData: JSON.stringify({ ...extraData, webhookRegistrado: true }) },
    })

    return NextResponse.redirect(new URL("/integracoes/kommo?sucesso=webhook-registrado", req.url))
  } catch (e) {
    clearTimeout(timeout)
    const msg = e instanceof Error && e.name === "AbortError" ? "timeout" : "falha-ao-registrar"
    return NextResponse.redirect(new URL(`/integracoes/kommo?erro=${msg}`, req.url))
  }
}
