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
  origem: z.enum(["FC", "LINK", "TRAFEGO", "RECORRENCIA", "REMARTIK"]).optional(),
  valor: z.number().min(0).optional().nullable(),
  valorProcedimento: z.number().min(0).optional().nullable(),
  status: z.enum(["REALIZADA", "CANCELADA", "PENDENTE"]).optional(),
  observacoes: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
})

export const updateConsultaAction = createProtectedAction(
  ["ADMIN", "GESTOR"],
  async (input: z.infer<typeof schema>) => {
    const { id, dataConsulta, dataPagamento, ...rest } = schema.parse(input)

    if (dataPagamento && dataPagamento > new Date()) {
      throw new Error("A data de pagamento não pode ser uma data futura.")
    }

    const consulta = await prisma.consulta.update({
      where: { id },
      data: {
        ...rest,
        ...(dataConsulta && {
          dataConsulta,
          mes: dataConsulta.getMonth() + 1,
          ano: dataConsulta.getFullYear(),
        }),
        ...(dataPagamento !== undefined && {
          dataPagamento,
          mesPagamento: dataPagamento ? dataPagamento.getMonth() + 1 : null,
          anoPagamento: dataPagamento ? dataPagamento.getFullYear() : null,
        }),
      },
    })
    revalidatePath("/consultas")
    return consulta
  }
)
