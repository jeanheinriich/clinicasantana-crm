"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

const schema = z.object({
  mes: z.number().min(1).max(12),
  ano: z.number().min(2020).max(2100),
  metaAceitavel: z.number().positive("Meta Aceitável deve ser positiva"),
  metaIdeal: z.number().positive("Meta Ideal deve ser positiva"),
  superMeta: z.number().positive("Super Meta deve ser positiva"),
})

export const upsertMetaFinanceiraAction = createProtectedAction(
  ["ADMIN", "GESTOR"],
  async (input: z.infer<typeof schema>) => {
    const data = schema.parse(input)
    const meta = await prisma.metaFinanceira.upsert({
      where: { mes_ano: { mes: data.mes, ano: data.ano } },
      create: data,
      update: {
        metaAceitavel: data.metaAceitavel,
        metaIdeal: data.metaIdeal,
        superMeta: data.superMeta,
      },
    })
    revalidatePath("/financeiro/metas")
    revalidatePath("/dashboard")
    return meta
  }
)
