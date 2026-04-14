import { auth } from "@/auth"
import type { PapelUsuario } from "@/lib/enums"

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function createProtectedAction<TInput, TOutput>(
  allowedRoles: PapelUsuario[],
  handler: (input: TInput, userId: string, papel: PapelUsuario) => Promise<TOutput>
) {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    const session = await auth()

    if (!session?.user) {
      return { success: false, error: "Não autenticado. Faça login para continuar." }
    }

    const papel = session.user.papel as PapelUsuario

    if (allowedRoles.length > 0 && !allowedRoles.includes(papel)) {
      return { success: false, error: "Sem permissão para realizar esta ação." }
    }

    try {
      const data = await handler(input, session.user.id, papel)
      return { success: true, data }
    } catch (e) {
      console.error("[safe-action]", e)
      return {
        success: false,
        error: e instanceof Error ? e.message : "Erro interno do servidor.",
      }
    }
  }
}
