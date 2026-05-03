import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const WEBHOOK_EVENTS = ["add_lead", "update_lead", "status_lead", "add_note"]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.papel !== "ADMIN") {
    return Response.redirect(new URL("/integracoes/kommo?erro=sem-permissao", new URL(req.url).origin))
  }

  const config = await prisma.integracaoConfig.findUnique({ where: { servico: "KOMMO" } })
  if (!config?.accessToken) {
    return Response.redirect(new URL("/integracoes/kommo?erro=token-nao-configurado", new URL(req.url).origin))
  }

  const subdomain = process.env.KOMMO_SUBDOMAIN
  const baseUrl   = process.env.NEXT_PUBLIC_BASE_URL
  if (!subdomain || !baseUrl) {
    return Response.redirect(new URL("/integracoes/kommo?erro=variaveis-nao-configuradas", new URL(req.url).origin))
  }

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
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      // Kommo retorna validation-errors quando o plano não permite webhooks
      const msg =
        (err as { detail?: string })?.detail ??
        "erro-kommo"
      return Response.redirect(
        new URL(`/integracoes/kommo?erro=${encodeURIComponent(msg)}`, new URL(req.url).origin)
      )
    }

    // Salva flag no extraData para mostrar status na página
    const extraData = (config.extraData as Record<string, unknown> | null) ?? {}
    await prisma.integracaoConfig.update({
      where: { servico: "KOMMO" },
      data: { extraData: JSON.stringify({ ...extraData, webhookRegistrado: true }) },
    })

    return Response.redirect(new URL("/integracoes/kommo?sucesso=webhook-registrado", new URL(req.url).origin))
  } catch {
    return Response.redirect(new URL("/integracoes/kommo?erro=falha-ao-registrar", new URL(req.url).origin))
  }
}
