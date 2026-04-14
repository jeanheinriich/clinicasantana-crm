"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

const schema = z.object({
  mes: z.number().min(1).max(12),
  ano: z.number().min(2020).max(2100),
  totalLeads: z.number().min(0),
  leadsTrafego: z.number().min(0),
  leadsImpulsionar: z.number().min(0),
  leadsRemartik: z.number().min(0),
  leadsFC: z.number().min(0),
  leadsLink: z.number().min(0),
  leadsFabrica: z.number().min(0),
  leadsTurbinar: z.number().min(0),
  consultasAgendadas: z.number().min(0),
  consultasRealizadas: z.number().min(0),
})

export const upsertIndicadorConversaoAction = createProtectedAction(
  ["ADMIN", "GESTOR"],
  async (input: z.infer<typeof schema>) => {
    const data = schema.parse(input)
    const indicador = await prisma.indicadorConversao.upsert({
      where: { mes_ano: { mes: data.mes, ano: data.ano } },
      create: data,
      update: {
        totalLeads: data.totalLeads,
        leadsTrafego: data.leadsTrafego,
        leadsImpulsionar: data.leadsImpulsionar,
        leadsRemartik: data.leadsRemartik,
        leadsFC: data.leadsFC,
        leadsLink: data.leadsLink,
        leadsFabrica: data.leadsFabrica,
        leadsTurbinar: data.leadsTurbinar,
        consultasAgendadas: data.consultasAgendadas,
        consultasRealizadas: data.consultasRealizadas,
      },
    })
    revalidatePath("/indicadores/conversao")
    return indicador
  }
)
