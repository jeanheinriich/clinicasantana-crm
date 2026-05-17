import { prisma } from "@/lib/prisma"

const META_API_VERSION = "v21.0"
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`

export interface MetaCampanhaData {
  campanhaId: string
  nome: string
  status: string
  investimento: number
  alcance: number
  impressoes: number
  cliques: number
  vistas: number
  seguidores: number
  leadsGerados: number
  custoPorLead: number | null
  dataInicio: Date | null
  dataFim: Date | null
}

async function getAccessToken(): Promise<string | null> {
  const config = await prisma.integracaoConfig.findUnique({
    where: { servico: "META" },
  })
  if (!config?.accessToken) return null

  // Refresh proativo se expira em menos de 7 dias
  if (config.expiresAt) {
    const diasRestantes =
      (config.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    if (diasRestantes < 7) {
      await refreshMetaToken(config.accessToken)
      const updated = await prisma.integracaoConfig.findUnique({
        where: { servico: "META" },
      })
      return updated?.accessToken ?? null
    }
  }

  return config.accessToken
}

export async function refreshMetaToken(currentToken: string): Promise<void> {
  const url = new URL(`${META_API_BASE}/oauth/access_token`)
  url.searchParams.set("grant_type", "fb_exchange_token")
  url.searchParams.set("client_id", process.env.META_APP_ID!)
  url.searchParams.set("client_secret", process.env.META_APP_SECRET!)
  url.searchParams.set("fb_exchange_token", currentToken)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error("Falha ao renovar token Meta")

  const data = await res.json()
  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000)
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 dias default

  await prisma.integracaoConfig.upsert({
    where: { servico: "META" },
    create: {
      servico: "META",
      accessToken: data.access_token,
      expiresAt,
    },
    update: {
      accessToken: data.access_token,
      expiresAt,
    },
  })
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<void> {
  // Troca code por short-lived token
  const shortUrl = new URL(`${META_API_BASE}/oauth/access_token`)
  shortUrl.searchParams.set("client_id", process.env.META_APP_ID!)
  shortUrl.searchParams.set("client_secret", process.env.META_APP_SECRET!)
  shortUrl.searchParams.set("redirect_uri", redirectUri)
  shortUrl.searchParams.set("code", code)

  const shortRes = await fetch(shortUrl.toString())
  if (!shortRes.ok) {
    const err = await shortRes.json()
    throw new Error(err.error?.message ?? "Falha ao trocar código Meta")
  }
  const shortData = await shortRes.json()

  // Troca por long-lived token (60 dias)
  await refreshMetaToken(shortData.access_token)

  // Descobrir pageId e igUserId e salvar em extraData
  const longToken = await getAccessToken()
  if (longToken) await discoverAndSaveAccountIds(longToken)
}

async function discoverAndSaveAccountIds(accessToken: string): Promise<void> {
  const url = new URL(`${META_API_BASE}/me/accounts`)
  url.searchParams.set("fields", "id,name,instagram_business_account")
  url.searchParams.set("access_token", accessToken)

  const res = await fetch(url.toString())
  if (!res.ok) {
    console.warn("[Meta] Não foi possível descobrir pageId:", await res.text())
    return
  }

  const data = await res.json()
  const page = (data.data as Array<{ id: string; instagram_business_account?: { id: string } }>)?.[0]
  if (!page) {
    console.warn("[Meta] Nenhuma página vinculada encontrada")
    return
  }

  const pageId    = String(page.id)
  const igUserId  = page.instagram_business_account?.id ?? null

  console.log(`[Meta] pageId=${pageId} igUserId=${igUserId ?? "não encontrado"}`)

  await prisma.integracaoConfig.update({
    where: { servico: "META" },
    data:  { extraData: JSON.stringify({ pageId, igUserId }) },
  })
}

export async function syncCampanhas(): Promise<{ upserted: number }> {
  const accessToken = await getAccessToken()
  if (!accessToken) throw new Error("Token Meta não configurado")

  const adAccountId = process.env.META_AD_ACCOUNT_ID
  if (!adAccountId) throw new Error("META_AD_ACCOUNT_ID não configurado")

  const now      = new Date()
  const since    = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
  const until    = now.toISOString().split("T")[0]
  const timeRange = JSON.stringify({ since, until })

  const url = new URL(`${META_API_BASE}/${adAccountId}/campaigns`)
  url.searchParams.set("access_token", accessToken)
  url.searchParams.set(
    "fields",
    `id,name,status,start_time,stop_time,insights.time_range(${timeRange}){spend,reach,impressions,clicks,actions}`
  )
  url.searchParams.set("limit", "100")

  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json()
    console.error("[Meta syncCampanhas] erro API:", JSON.stringify(err))
    throw new Error(err.error?.message ?? "Falha ao buscar campanhas Meta")
  }

  const data = await res.json()
  const campanhas: MetaCampanhaData[] = (data.data ?? []).map((c: Record<string, unknown>) => {
    const insights = (c.insights as { data: Record<string, unknown>[] } | undefined)?.data?.[0] ?? {}
    const spend = parseFloat((insights.spend as string | undefined) ?? "0")

    const actions = (insights.actions as Array<{ action_type: string; value: string }> | undefined) ?? []
    const findAction = (type: string) =>
      parseInt(actions.find((a) => a.action_type === type)?.value ?? "0", 10)

    const vistas    = findAction("video_view")
    const seguidores = findAction("follow") || findAction("onsite_conversion.post_net_like")
    const leads      = findAction("lead") || findAction("onsite_conversion.lead_grouped")

    return {
      campanhaId:   String(c.id),
      nome:         String(c.name),
      status:       String(c.status),
      investimento: spend,
      alcance:      parseInt((insights.reach as string | undefined) ?? "0", 10),
      impressoes:   parseInt((insights.impressions as string | undefined) ?? "0", 10),
      cliques:      parseInt((insights.clicks as string | undefined) ?? "0", 10),
      vistas,
      seguidores,
      leadsGerados: leads,
      custoPorLead: leads > 0 ? spend / leads : null,
      dataInicio:   c.start_time ? new Date(String(c.start_time)) : null,
      dataFim:      c.stop_time ? new Date(String(c.stop_time)) : null,
    }
  })

  let upserted = 0
  for (const campanha of campanhas) {
    await prisma.metaCampanha.upsert({
      where: { campanhaId: campanha.campanhaId },
      create: { ...campanha, sincronizadoEm: new Date() },
      update: { ...campanha, sincronizadoEm: new Date() },
    })
    upserted++
  }

  return { upserted }
}
