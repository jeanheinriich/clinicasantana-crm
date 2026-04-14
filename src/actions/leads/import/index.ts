"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

const LeadImportRowSchema = z.object({
  nome: z.string().min(1),
  canal: z.enum(["IMPULSIONAR", "REMARTIK", "TRAFEGO", "FC", "LINK", "FABRICA_INSTAGRAM", "TURBINAR", "OUTRO"]),
  codigoWhatsApp: z.string().optional(),
  status: z
    .enum(["ABORDAGEM", "EM_CONVERSA", "AGENDADO", "CONVERTIDO", "CANCELADO", "PAROU_DE_INTERAGIR", "FECHOU", "CONSULTA_FECHADA", "LEAD_PERDIDO"])
    .default("ABORDAGEM"),
  observacoes: z.string().optional(),
})

const schema = z.object({
  rows: z.array(LeadImportRowSchema),
})

export const importLeadsAction = createProtectedAction(
  ["ADMIN", "GESTOR"],
  async (input: z.infer<typeof schema>, userId) => {
    const { rows } = schema.parse(input)

    const leadsToCreate = rows.map((row) => ({
      ...row,
      userId,
    }))

    const result = await prisma.lead.createMany({
      data: leadsToCreate,
    })

    revalidatePath("/leads")
    return { count: result.count }
  }
)

export { LeadImportRowSchema }
export type LeadImportRow = z.infer<typeof LeadImportRowSchema>
