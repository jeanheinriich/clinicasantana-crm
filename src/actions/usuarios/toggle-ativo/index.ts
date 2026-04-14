"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"

const schema = z.object({ id: z.string() })

export const toggleUsuarioAtivoAction = createProtectedAction(
  ["ADMIN"],
  async (input: z.infer<typeof schema>, currentUserId) => {
    const { id } = schema.parse(input)
    if (id === currentUserId) throw new Error("Não é possível desativar sua própria conta.")
    const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id } })
    const updated = await prisma.usuario.update({
      where: { id },
      data: { ativo: !usuario.ativo },
    })
    revalidatePath("/usuarios")
    return { id: updated.id, ativo: updated.ativo }
  }
)
