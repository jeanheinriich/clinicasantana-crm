"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

const schema = z.object({
  mes: z.number().min(1).max(12),
  ano: z.number().min(2020).max(2100),
  agendamentosNovosQtd: z.number().min(0),
  agendamentosNovosValor: z.number().min(0),
  recorrenciaQtd: z.number().min(0),
  recorrenciaValor: z.number().min(0),
})

export const upsertIndicadorComercialAction = createProtectedAction(
  ["ADMIN", "GESTOR"],
  async (input: z.infer<typeof schema>) => {
    const data = schema.parse(input)
    const indicador = await prisma.indicadorComercial.upsert({
      where: { mes_ano: { mes: data.mes, ano: data.ano } },
      create: data,
      update: {
        agendamentosNovosQtd: data.agendamentosNovosQtd,
        agendamentosNovosValor: data.agendamentosNovosValor,
        recorrenciaQtd: data.recorrenciaQtd,
        recorrenciaValor: data.recorrenciaValor,
      },
    })
    revalidatePath("/indicadores/comercial")
    return indicador
  }
)
