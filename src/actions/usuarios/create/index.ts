"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  papel: z.enum(["ADMIN", "GESTOR", "ATENDENTE", "VISUALIZADOR"]),
})

export const createUsuarioAction = createProtectedAction(
  ["ADMIN"],
  async (input: z.infer<typeof schema>) => {
    const data = schema.parse(input)
    const senhaHash = await bcrypt.hash(data.senha, 12)
    const usuario = await prisma.usuario.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha: senhaHash,
        papel: data.papel,
      },
    })
    revalidatePath("/usuarios")
    return { id: usuario.id, nome: usuario.nome, email: usuario.email }
  }
)
