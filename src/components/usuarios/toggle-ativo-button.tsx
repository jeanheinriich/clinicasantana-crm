"use client"

import { toast } from "sonner"
import { toggleUsuarioAtivoAction } from "@/actions/usuarios/toggle-ativo"
import { Button } from "@/components/ui/button"

export function ToggleAtivoButton({ id, ativo }: { id: string; ativo: boolean }) {
  async function handleClick() {
    const result = await toggleUsuarioAtivoAction({ id })
    if (result.success) {
      toast.success(result.data.ativo ? "Usuário ativado!" : "Usuário desativado!")
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={ativo ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
    >
      {ativo ? "Desativar" : "Ativar"}
    </Button>
  )
}
