"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

const schema = z.object({
  consultaId: z.string().min(1, "Consulta é obrigatória"),
  valor: z.number().positive("Valor deve ser positivo"),
  dataVenda: z.string().or(z.date()).transform((v) => new Date(v)),
  status: z.enum(["PENDENTE", "REALIZADA", "CANCELADA"]).default("PENDENTE"),
  observacao: z.string().optional(),
})

export const createVendaAction = createProtectedAction(
  ["ADMIN", "GESTOR", "ATENDENTE"],
  async (input: z.infer<typeof schema>) => {
    const data = schema.parse(input)
    const venda = await prisma.venda.create({
      data: {
        ...data,
        mes: data.dataVenda.getMonth() + 1,
        ano: data.dataVenda.getFullYear(),
      },
    })
    revalidatePath("/vendas")
    return venda
  }
)
