import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const WEBHOOK_EVENTS = ["add_lead", "update_lead", "status_lead", "add_note"]

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.papel !== "ADMIN") {
    return NextResponse.json({ erro: "sem-permissao" }, { status: 403 })
  }

  const config = await prisma.integracaoConfig.findUnique({ where: { servico: "KOMMO" } })
  if (!config?.accessToken) {
    return NextResponse.json({ erro: "token-nao-configurado" }, { status: 400 })
  }

  const subdomain = process.env.KOMMO_SUBDOMAIN
  const baseUrl   = process.env.NEXT_PUBLIC_BASE_URL
  if (!subdomain || !baseUrl) {
    return NextResponse.json({ erro: "variaveis-nao-configuradas" }, { status: 500 })
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
      return NextResponse.json({ erro: msg }, { status: 400 })
    }

    const extraData = (config.extraData as Record<string, unknown> | null) ?? {}
    await prisma.integracaoConfig.update({
      where: { servico: "KOMMO" },
      data: { extraData: JSON.stringify({ ...extraData, webhookRegistrado: true }) },
    })

    return NextResponse.json({ sucesso: true })
  } catch (e) {
    clearTimeout(timeout)
    const msg = e instanceof Error && e.name === "AbortError" ? "Timeout ao conectar com Kommo" : "Falha ao registrar webhook"
    return NextResponse.json({ erro: msg }, { status: 500 })
  }
}
