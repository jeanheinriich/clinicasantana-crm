import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ImportConsultasDialog } from "@/components/consultas/import-consultas-dialog"
import { temPermissao } from "@/lib/permissions"
import type { PapelUsuario } from "@/lib/enums"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function ImportarConsultasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const papel = session.user.papel as PapelUsuario
  if (!temPermissao(papel, "consultas", "edit")) redirect("/dashboard?erro=sem-permissao")

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/consultas">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Importar Consultas</h2>
          <p className="text-muted-foreground text-sm">
            Importe dados históricos a partir de planilhas CSV ou XLSX
          </p>
        </div>
      </div>
      <ImportConsultasDialog inline />
    </div>
  )
}
