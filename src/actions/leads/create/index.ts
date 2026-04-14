"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  canal: z.enum(["IMPULSIONAR", "REMARTIK", "TRAFEGO", "FC", "LINK", "FABRICA_INSTAGRAM", "TURBINAR", "OUTRO"]),
  codigoWhatsApp: z.string().optional(),
  status: z
    .enum(["ABORDAGEM", "EM_CONVERSA", "AGENDADO", "CONVERTIDO", "CANCELADO", "PAROU_DE_INTERAGIR", "FECHOU", "CONSULTA_FECHADA", "LEAD_PERDIDO"])
    .default("ABORDAGEM"),
  observacoes: z.string().optional(),
})

export const createLeadAction = createProtectedAction(
  ["ADMIN", "GESTOR", "ATENDENTE"],
  async (input: z.infer<typeof schema>, userId) => {
    const data = schema.parse(input)
    const lead = await prisma.lead.create({
      data: {
        ...data,
        userId,
      },
    })
    revalidatePath("/leads")
    return lead
  }
)
