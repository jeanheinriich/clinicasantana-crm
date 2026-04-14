import { auth } from "@/auth"
import { pollKommoLeads } from "@/lib/kommo-api"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.papel !== "ADMIN") {
    return Response.json({ erro: "Sem permissão" }, { status: 403 })
  }

  try {
    const result = await pollKommoLeads(session.user.id)
    return Response.json({ sucesso: true, ...result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao fazer polling"
    return Response.json({ erro: msg }, { status: 500 })
  }
}
