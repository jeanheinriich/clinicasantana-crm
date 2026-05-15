"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

const schema = z.object({
  id: z.string(),
  consultaId: z.string().min(1).optional(),
  valor: z.number().positive().optional(),
  dataVenda: z.string().or(z.date()).transform((v) => new Date(v)).optional(),
  status: z.enum(["PENDENTE", "REALIZADA", "CANCELADA"]).optional(),
  observacao: z.string().optional().nullable(),
})

export const updateVendaAction = createProtectedAction(
  ["ADMIN", "GESTOR"],
  async (input: z.infer<typeof schema>) => {
    const { id, dataVenda, ...rest } = schema.parse(input)
    const venda = await prisma.venda.update({
      where: { id },
      data: {
        ...rest,
        ...(dataVenda && {
          dataVenda,
          mes: dataVenda.getMonth() + 1,
          ano: dataVenda.getFullYear(),
        }),
      },
    })
    revalidatePath("/vendas")
    return venda
  }
)
