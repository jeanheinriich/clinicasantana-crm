import { createHmac, timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"
import type { CanalLead, StatusLead } from "@/lib/enums"

// Espelho de KOMMO_STATUS_MAP em kommo-api.ts — manter sincronizados
const KOMMO_STATUS_MAP: Record<number, StatusLead> = {
  91327884: "ABORDAGEM",           91327888: "ABORDAGEM",
  91327892: "EM_CONVERSA",         91327896: "PAROU_DE_INTERAGIR",
  91327900: "EM_CONVERSA",         91328055: "EM_CONVERSA",
  91328059: "EM_CONVERSA",         91328063: "EM_CONVERSA",
  91328067: "EM_CONVERSA",         91328071: "EM_CONVERSA",
  91328115: "CONVERTIDO",          91328119: "CONVERTIDO",
  91328123: "CONVERTIDO",          91328127: "CONVERTIDO",
  91328319: "AGENDADO",
  94808591: "CONVERTIDO",          94808595: "CONVERTIDO",
  94808599: "CONVERTIDO",          94808603: "CONVERTIDO",
  142:      "FECHOU",
  143:      "LEAD_PERDIDO",
}

// Kommo webhook events
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
  tags?: string
}

interface KommoNoteEvent {
  id: string
  element_id: string
  text: string
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
    await prisma.lead.upsert({
      where: { kommoLeadId: String(lead.id) },
      create: {
        nome: lead.name || `Lead #${lead.id}`,
        canal: "LINK" as CanalLead,
        status: "ABORDAGEM" as StatusLead,
        kommoLeadId: String(lead.id),
        userId,
      },
      update: { dataUltimaInteracao: new Date() },
    })
  }

  // Atualização de status
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
    await prisma.lead.updateMany({
      where: { kommoLeadId: String(lead.id) },
      data: {
        dataUltimaInteracao: new Date(),
        ...(novoStatus ? { status: novoStatus } : {}),
      },
    })
  }

  // Notas → interações
  const notes = payload["note[lead]"] ?? []
  for (const note of notes) {
    const leadDb = await prisma.lead.findUnique({
      where: { kommoLeadId: String(note.element_id) },
    })
    if (leadDb) {
      await prisma.leadInteracao.create({
        data: {
          leadId: leadDb.id,
          descricao: `[Kommo] ${note.text}`,
        },
      })
    }
  }
}

export async function POST(req: Request) {
  const secret = process.env.KOMMO_SECRET
  if (!secret) {
    return new Response("KOMMO_SECRET não configurado", { status: 500 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get("x-kommo-signature") ?? ""

  // Verificação HMAC-SHA1
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
    // Kommo pode enviar form-encoded ou JSON
    const contentType = req.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
      payload = JSON.parse(rawBody)
    } else {
      // application/x-www-form-urlencoded
      const params = new URLSearchParams(rawBody)
      payload = Object.fromEntries(params.entries()) as KommoWebhookPayload
    }
  } catch {
    return new Response("Payload inválido", { status: 400 })
  }

  // Processa assincronamente (não bloqueia a resposta)
  processEvent(payload).catch(console.error)

  return new Response("OK", { status: 200 })
}
