"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

const schema = z.object({
  id: z.string(),
  nome: z.string().min(1).optional(),
  email: z.string().email().optional(),
  senha: z.string().min(6).optional(),
  papel: z.enum(["ADMIN", "GESTOR", "ATENDENTE", "VISUALIZADOR"]).optional(),
})

export const updateUsuarioAction = createProtectedAction(
  ["ADMIN"],
  async (input: z.infer<typeof schema>) => {
    const { id, senha, ...data } = schema.parse(input)
    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        ...data,
        ...(senha && { senha: await bcrypt.hash(senha, 12) }),
      },
    })
    revalidatePath("/usuarios")
    return { id: usuario.id, nome: usuario.nome }
  }
)
