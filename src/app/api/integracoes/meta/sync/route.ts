import { auth } from "@/auth"
import { syncCampanhas, syncSeguidoresMensais } from "@/lib/meta-api"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.papel !== "ADMIN") {
    return Response.json({ erro: "Sem permissão" }, { status: 403 })
  }

  try {
    const hoje = new Date()
    const [campanhas, insights] = await Promise.allSettled([
      syncCampanhas(),
      syncSeguidoresMensais(hoje.getMonth() + 1, hoje.getFullYear()),
    ])

    return Response.json({
      sucesso:    true,
      campanhas:  campanhas.status === "fulfilled" ? campanhas.value : { erro: (campanhas.reason as Error).message },
      seguidores: insights.status  === "fulfilled" ? insights.value  : { erro: (insights.reason  as Error).message },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao sincronizar"
    return Response.json({ erro: msg }, { status: 500 })
  }
}
