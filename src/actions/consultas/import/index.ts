"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

const ConsultaImportRowSchema = z.object({
  nomeCliente: z.string().min(1),
  dataConsulta: z.string().transform((v) => new Date(v)),
  dataPagamento: z
    .string()
    .transform((v) => new Date(v))
    .optional()
    .nullable(),
  origem: z.enum(["FC", "LINK", "TRAFEGO", "TRAFEGO_RECORRENCIA", "REMARTIK"]),
  valor: z
    .string()
    .optional()
    .nullable()
    .transform((v) => {
      if (!v) return null
      const num = parseFloat(v.replace(/[R$\s.]/g, "").replace(",", "."))
      return isNaN(num) ? null : num
    }),
  status: z
    .enum(["REALIZADA", "CANCELADA", "PENDENTE"])
    .default("REALIZADA"),
})

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

export { ConsultaImportRowSchema }
export type ConsultaImportRow = z.infer<typeof ConsultaImportRowSchema>
