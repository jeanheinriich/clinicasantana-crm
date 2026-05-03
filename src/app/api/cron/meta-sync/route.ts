import { syncCampanhas } from "@/lib/meta-api"

export async function GET(req: Request) {
  const cronSecret = req.headers.get("authorization")
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ erro: "Não autorizado" }, { status: 401 })
  }

  try {
    const result = await syncCampanhas()
    return Response.json({ sucesso: true, ...result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro no cron Meta sync"
    console.error("[cron/meta-sync]", msg)
    return Response.json({ erro: msg }, { status: 500 })
  }
}
