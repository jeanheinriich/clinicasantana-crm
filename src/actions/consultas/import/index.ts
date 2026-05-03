"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"
import { ConsultaImportRowSchema } from "./schema"

const schema = z.object({
  rows: z.array(ConsultaImportRowSchema),
})

export const importConsultasAction = createProtectedAction(
  ["ADMIN", "GESTOR"],
  async (input: z.infer<typeof schema>) => {
    const { rows } = schema.parse(input)

    const consultasToCreate = rows.map((row) => ({
      ...row,
      dataConsulta: row.dataConsulta,
      mes: row.dataConsulta.getMonth() + 1,
      ano: row.dataConsulta.getFullYear(),
    }))

    const result = await prisma.consulta.createMany({
      data: consultasToCreate,
    })

    revalidatePath("/consultas")
    return { count: result.count }
  }
)

export type { ConsultaImportRow } from "./schema"
