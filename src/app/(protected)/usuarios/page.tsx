import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UsuarioFormDialog } from "@/components/usuarios/usuario-form-dialog"
import { ToggleAtivoButton } from "@/components/usuarios/toggle-ativo-button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/utils"
import { temPermissao } from "@/lib/permissions"
import type { PapelUsuario } from "@/lib/enums"

const PAPEL_LABELS: Record<PapelUsuario, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  ATENDENTE: "Atendente",
  VISUALIZADOR: "Visualizador",
}

export default async function UsuariosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const papel = session.user.papel as PapelUsuario
  if (!temPermissao(papel, "usuarios", "view")) redirect("/dashboard?erro=sem-permissao")

  const usuarios = await prisma.usuario.findMany({
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      nome: true,
      email: true,
      papel: true,
      ativo: true,
      criadoEm: true,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Usuários</h2>
          <p className="text-muted-foreground text-sm">{usuarios.length} usuários cadastrados</p>
        </div>
        <UsuarioFormDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id} className={!u.ativo ? "opacity-50" : ""}>
                <TableCell className="font-medium">{u.nome}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{PAPEL_LABELS[u.papel as PapelUsuario] ?? u.papel}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.ativo ? "success" : "secondary"}>
                    {u.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(u.criadoEm)}
                </TableCell>
                <TableCell className="flex gap-1">
                  <UsuarioFormDialog usuario={u as Parameters<typeof UsuarioFormDialog>[0]["usuario"]}>
                    <Button variant="ghost" size="sm">Editar</Button>
                  </UsuarioFormDialog>
                  {u.id !== session.user.id && (
                    <ToggleAtivoButton id={u.id} ativo={u.ativo} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
