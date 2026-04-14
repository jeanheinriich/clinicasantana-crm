"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

const schema = z.object({
  id: z.string(),
  status: z.enum(["ABORDAGEM", "EM_CONVERSA", "AGENDADO", "CONVERTIDO", "CANCELADO", "PAROU_DE_INTERAGIR", "FECHOU", "CONSULTA_FECHADA", "LEAD_PERDIDO"]),
})

export const updateLeadStatusAction = createProtectedAction(
  ["ADMIN", "GESTOR", "ATENDENTE"],
  async (input: z.infer<typeof schema>) => {
    const { id, status } = schema.parse(input)
    const lead = await prisma.lead.update({
      where: { id },
      data: { status, dataUltimaInteracao: new Date() },
    })
    revalidatePath("/leads")
    revalidatePath(`/leads/${id}`)
    return lead
  }
)
