import { prisma } from "@/lib/prisma"
import type { CanalLead, StatusLead } from "@/lib/enums"

type KommoLeadRaw = {
  id: number
  name: string
  status_id: number
  pipeline_id: number
  updated_at: number
  tags?: { id: number; name: string }[]
}

// Mapeamento de status Kommo → StatusLead do sistema
// Ajuste os IDs de acordo com a configuração do funil do cliente
const KOMMO_STATUS_MAP: Record<number, StatusLead> = {
  // 142 = Nova negociação (default Kommo)
  142: "ABORDAGEM",
  // Adicione os IDs reais dos estágios do funil do cliente aqui
}

// Mapeamento de tags Kommo → CanalLead
const KOMMO_CANAL_MAP: Record<string, CanalLead> = {
  impulsionar: "IMPULSIONAR",
  remartik: "REMARTIK",
  trafego: "TRAFEGO",
  "tráfego": "TRAFEGO",
  fc: "FC",
  link: "LINK",
}

function inferCanal(lead: KommoLeadRaw): CanalLead {
  if (lead.tags && lead.tags.length > 0) {
    for (const tag of lead.tags) {
      const key = tag.name.toLowerCase().trim()
      if (KOMMO_CANAL_MAP[key]) return KOMMO_CANAL_MAP[key]
    }
  }
  return "LINK" // fallback
}

function inferStatus(lead: KommoLeadRaw): StatusLead {
  return KOMMO_STATUS_MAP[lead.status_id] ?? "ABORDAGEM"
}

async function getKommoConfig() {
  const config = await prisma.integracaoConfig.findUnique({
    where: { servico: "KOMMO" },
  })
  return config
}

export async function pollKommoLeads(userId: string): Promise<{ upserted: number }> {
  const config = await getKommoConfig()
  if (!config?.accessToken) throw new Error("Token Kommo não configurado")

  const subdomain = process.env.KOMMO_SUBDOMAIN
  if (!subdomain) throw new Error("KOMMO_SUBDOMAIN não configurado")

  const extraData = (config.extraData as Record<string, unknown> | null) ?? {}
  const lastPollAt = extraData.lastPollAt
    ? Math.floor(new Date(String(extraData.lastPollAt)).getTime() / 1000)
    : Math.floor((Date.now() - 35 * 60 * 1000) / 1000) // 35min atrás

  let page = 1
  let totalUpserted = 0
  let hasMore = true

  while (hasMore) {
    const url = new URL(`https://${subdomain}.kommo.com/api/v4/leads`)
    url.searchParams.set("updated_at[from]", String(lastPollAt))
    url.searchParams.set("limit", "250")
    url.searchParams.set("page", String(page))
    url.searchParams.set("with", "tags")

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (res.status === 204) break // sem dados
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.title ?? "Falha ao buscar leads do Kommo")
    }

    const data = await res.json()
    const leads: KommoLeadRaw[] = data._embedded?.leads ?? []

    for (const lead of leads) {
      const canal = inferCanal(lead)
      const status = inferStatus(lead)

      await prisma.lead.upsert({
        where: { kommoLeadId: String(lead.id) },
        create: {
          nome: lead.name || `Lead #${lead.id}`,
          canal,
          status,
          kommoLeadId: String(lead.id),
          userId,
        },
        update: {
          nome: lead.name || `Lead #${lead.id}`,
          status,
          dataUltimaInteracao: new Date(lead.updated_at * 1000),
        },
      })
      totalUpserted++
    }

    // Verifica se há próxima página
    hasMore = !!data._links?.next
    page++
  }

  // Atualiza timestamp do último poll
  await prisma.integracaoConfig.update({
    where: { servico: "KOMMO" },
    data: {
      extraData: JSON.stringify({ ...extraData, lastPollAt: new Date().toISOString() }),
    },
  })

  return { upserted: totalUpserted }
}

export async function refreshKommoToken(): Promise<void> {
  const config = await getKommoConfig()
  if (!config?.refreshToken) throw new Error("Refresh token Kommo não disponível")

  const subdomain = process.env.KOMMO_SUBDOMAIN!

  const res = await fetch(`https://${subdomain}.kommo.com/oauth2/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.KOMMO_CLIENT_ID,
      client_secret: process.env.KOMMO_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: config.refreshToken,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/integracoes/kommo/callback`,
    }),
  })

  if (!res.ok) throw new Error("Falha ao renovar token Kommo")

  const data = await res.json()
  await prisma.integracaoConfig.update({
    where: { servico: "KOMMO" },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  })
}
