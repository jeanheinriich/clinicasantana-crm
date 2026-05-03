import { createHmac, timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"
import type { CanalLead, StatusLead } from "@/lib/enums"
import { KOMMO_STATUS_MAP } from "@/lib/kommo-api"

interface KommoWebhookPayload {
  leads?: {
    add?: KommoLeadEvent[]
    update?: KommoLeadEvent[]
    status?: KommoLeadEvent[]
  }
  "leads[add]"?: KommoLeadEvent[]
  "leads[update]"?: KommoLeadEvent[]
  "leads[status]"?: KommoLeadEvent[]
  "note[lead]"?: KommoNoteEvent[]
}

interface KommoLeadEvent {
  id: string
  name: string
  status_id?: string
  pipeline_id?: string
}

interface KommoNoteEvent {
  id: string
  element_id: string
  text: string
}

// Kommo envia application/x-www-form-urlencoded com notação PHP de arrays:
// leads[add][0][id]=123&leads[add][0][name]=Teste
// Object.fromEntries não resolve — precisa de parser que recrie a estrutura.
function parseKommoBody(rawBody: string, contentType: string): KommoWebhookPayload {
  if (contentType.includes("application/json")) {
    return JSON.parse(rawBody) as KommoWebhookPayload
  }

  const params = new URLSearchParams(rawBody)
  const events: Record<string, Record<string, string>[]> = {}

  for (const [key, value] of params.entries()) {
    // Padrão: leads[add][0][id], note[lead][0][element_id], etc.
    const m = key.match(/^([a-z]+\[[a-z_]+\])\[(\d+)\]\[([a-z_]+)\]$/)
    if (!m) continue

    const [, eventKey, idxStr, field] = m
    const idx = parseInt(idxStr, 10)

    if (!events[eventKey]) events[eventKey] = []
    if (!events[eventKey][idx]) events[eventKey][idx] = {}
    events[eventKey][idx][field] = value
  }

  return events as unknown as KommoWebhookPayload
}

async function getAdminUserId(): Promise<string | null> {
  const admin = await prisma.usuario.findFirst({
    where: { papel: "ADMIN", ativo: true },
    select: { id: true },
  })
  return admin?.id ?? null
}

async function processEvent(payload: KommoWebhookPayload): Promise<void> {
  const userId = await getAdminUserId()
  if (!userId) return

  // Novos leads
  const newLeads = payload.leads?.add ?? payload["leads[add]"] ?? []
  for (const lead of newLeads) {
    const status: StatusLead = lead.status_id
      ? (KOMMO_STATUS_MAP[parseInt(lead.status_id)] ?? "ABORDAGEM")
      : "ABORDAGEM"

    console.log("[Webhook Kommo]", {
      evento: "leads[add]",
      leadId: lead.id,
      statusId: lead.status_id ?? null,
      statusMapeado: status,
      timestamp: new Date().toISOString(),
    })

    await prisma.lead.upsert({
      where: { kommoLeadId: String(lead.id) },
      create: {
        nome: lead.name || `Lead #${lead.id}`,
        canal: "LINK" as CanalLead,
        status,
        kommoLeadId: String(lead.id),
        userId,
      },
      update: { dataUltimaInteracao: new Date() },
    })
  }

  // Mudança de estágio ou atualização de lead
  const updatedLeads = [
    ...(payload.leads?.update ?? []),
    ...(payload.leads?.status ?? []),
    ...(payload["leads[update]"] ?? []),
    ...(payload["leads[status]"] ?? []),
  ]

  for (const lead of updatedLeads) {
    const novoStatus = lead.status_id
      ? KOMMO_STATUS_MAP[parseInt(lead.status_id)]
      : undefined

    console.log("[Webhook Kommo]", {
      evento: "leads[status]",
      leadId: lead.id,
      statusId: lead.status_id ?? null,
      statusMapeado: novoStatus ?? "sem mapeamento",
      timestamp: new Date().toISOString(),
    })

    // Upsert: cria se o lead chegou antes da integração estar ativa
    await prisma.lead.upsert({
      where: { kommoLeadId: String(lead.id) },
      create: {
        nome: lead.name || `Lead #${lead.id}`,
        canal: "LINK" as CanalLead,
        status: novoStatus ?? "ABORDAGEM",
        kommoLeadId: String(lead.id),
        userId,
      },
      update: {
        dataUltimaInteracao: new Date(),
        ...(novoStatus ? { status: novoStatus } : {}),
      },
    })
  }

  // Notas → interações (batch para evitar N+1)
  const notes = payload["note[lead]"] ?? []
  if (notes.length > 0) {
    console.log("[Webhook Kommo]", {
      evento: "note[lead]",
      total: notes.length,
      timestamp: new Date().toISOString(),
    })
    const kommoIds = notes.map((n) => String(n.element_id))
    const leadsDb = await prisma.lead.findMany({
      where: { kommoLeadId: { in: kommoIds } },
      select: { id: true, kommoLeadId: true },
    })
    const leadMap = new Map(leadsDb.map((l) => [l.kommoLeadId, l.id]))
    const interacoes = notes
      .filter((n) => leadMap.has(String(n.element_id)))
      .map((n) => ({
        leadId: leadMap.get(String(n.element_id))!,
        descricao: `[Kommo] ${n.text}`,
      }))
    if (interacoes.length > 0) {
      await prisma.leadInteracao.createMany({ data: interacoes, skipDuplicates: true })
    }
  }
}

export async function POST(req: Request) {
  const secret = process.env.KOMMO_SECRET
  if (!secret) {
    return new Response("KOMMO_SECRET não configurado", { status: 500 })
  }

  const rawBody = await req.text()

  // Ping de verificação do Kommo (corpo vazio, sem assinatura)
  if (!rawBody || rawBody.trim() === "") {
    return new Response("OK", { status: 200 })
  }

  const signature = req.headers.get("x-kommo-signature") ?? ""

  const expected = createHmac("sha1", secret).update(rawBody).digest("hex")
  try {
    if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"))) {
      return new Response("Assinatura inválida", { status: 401 })
    }
  } catch {
    return new Response("Assinatura inválida", { status: 401 })
  }

  let payload: KommoWebhookPayload
  try {
    const contentType = req.headers.get("content-type") ?? ""
    payload = parseKommoBody(rawBody, contentType)
  } catch {
    return new Response("Payload inválido", { status: 400 })
  }

  processEvent(payload).catch(console.error)

  return new Response("OK", { status: 200 })
}
