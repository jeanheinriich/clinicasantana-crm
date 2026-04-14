"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

const schema = z.object({ id: z.string() })

export const deleteConsultaAction = createProtectedAction(
  ["ADMIN", "GESTOR"],
  async (input: z.infer<typeof schema>) => {
    const { id } = schema.parse(input)
    await prisma.consulta.delete({ where: { id } })
    revalidatePath("/consultas")
    return { id }
  }
)
