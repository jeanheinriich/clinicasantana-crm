"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

const schema = z.object({
  id: z.string(),
  nomeCliente: z.string().min(1).optional(),
  dataConsulta: z
    .string()
    .or(z.date())
    .transform((v) => new Date(v))
    .optional(),
  dataPagamento: z
    .string()
    .or(z.date())
    .transform((v) => new Date(v))
    .optional()
    .nullable(),
  origem: z.enum(["FC", "LINK", "TRAFEGO", "TRAFEGO_RECORRENCIA", "REMARTIK"]).optional(),
  valor: z.number().positive().optional().nullable(),
  status: z.enum(["REALIZADA", "CANCELADA", "PENDENTE"]).optional(),
  observacoes: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
})

export const updateConsultaAction = createProtectedAction(
  ["ADMIN", "GESTOR"],
  async (input: z.infer<typeof schema>) => {
    const { id, dataConsulta, ...data } = schema.parse(input)
    const consulta = await prisma.consulta.update({
      where: { id },
      data: {
        ...data,
        ...(dataConsulta && {
          dataConsulta,
          mes: dataConsulta.getMonth() + 1,
          ano: dataConsulta.getFullYear(),
        }),
      },
    })
    revalidatePath("/consultas")
    return consulta
  }
)
