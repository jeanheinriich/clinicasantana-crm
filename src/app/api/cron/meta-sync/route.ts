import { syncCampanhas, syncSeguidoresMensais } from "@/lib/meta-api"

export async function GET(req: Request) {
  const cronSecret = req.headers.get("authorization")
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ erro: "Não autorizado" }, { status: 401 })
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
    const msg = e instanceof Error ? e.message : "Erro no cron Meta sync"
    console.error("[cron/meta-sync]", msg)
    return Response.json({ erro: msg }, { status: 500 })
  }
}
