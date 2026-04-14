"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

const schema = z.object({
  leadId: z.string(),
  descricao: z.string().min(1, "Descrição é obrigatória"),
})

export const addLeadInteracaoAction = createProtectedAction(
  ["ADMIN", "GESTOR", "ATENDENTE"],
  async (input: z.infer<typeof schema>) => {
    const { leadId, descricao } = schema.parse(input)
    const interacao = await prisma.leadInteracao.create({
      data: { leadId, descricao },
    })
    await prisma.lead.update({
      where: { id: leadId },
      data: { dataUltimaInteracao: new Date() },
    })
    revalidatePath(`/leads/${leadId}`)
    return interacao
  }
)
