"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

const schema = z.object({
  id: z.string(),
  nome: z.string().min(1).optional(),
  canal: z.enum(["IMPULSIONAR", "REMARTIK", "TRAFEGO", "FC", "LINK", "FABRICA_INSTAGRAM", "TURBINAR", "OUTRO"]).optional(),
  codigoWhatsApp: z.string().optional().nullable(),
  status: z
    .enum(["ABORDAGEM", "EM_CONVERSA", "AGENDADO", "CONVERTIDO", "CANCELADO", "PAROU_DE_INTERAGIR", "FECHOU", "CONSULTA_FECHADA", "LEAD_PERDIDO"])
    .optional(),
  observacoes: z.string().optional().nullable(),
})

export const updateLeadAction = createProtectedAction(
  ["ADMIN", "GESTOR", "ATENDENTE"],
  async (input: z.infer<typeof schema>) => {
    const { id, ...data } = schema.parse(input)
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...data,
        dataUltimaInteracao: new Date(),
      },
    })
    revalidatePath("/leads")
    revalidatePath(`/leads/${id}`)
    return lead
  }
)
