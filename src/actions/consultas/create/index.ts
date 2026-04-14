"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

const schema = z.object({
  nomeCliente: z.string().min(1, "Nome do cliente é obrigatório"),
  dataConsulta: z.string().or(z.date()).transform((v) => new Date(v)),
  dataPagamento: z
    .string()
    .or(z.date())
    .transform((v) => new Date(v))
    .optional()
    .nullable(),
  origem: z.enum(["FC", "LINK", "TRAFEGO", "TRAFEGO_RECORRENCIA", "REMARTIK"]),
  valor: z.number().positive().optional().nullable(),
  status: z.enum(["REALIZADA", "CANCELADA", "PENDENTE"]).default("PENDENTE"),
  observacoes: z.string().optional(),
  leadId: z.string().optional().nullable(),
})

export const createConsultaAction = createProtectedAction(
  ["ADMIN", "GESTOR", "ATENDENTE"],
  async (input: z.infer<typeof schema>) => {
    const data = schema.parse(input)
    const dataConsulta = data.dataConsulta
    const consulta = await prisma.consulta.create({
      data: {
        ...data,
        mes: dataConsulta.getMonth() + 1,
        ano: dataConsulta.getFullYear(),
      },
    })
    revalidatePath("/consultas")
    return consulta
  }
)
