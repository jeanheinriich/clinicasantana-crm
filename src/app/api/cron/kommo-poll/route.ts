import { prisma } from "@/lib/prisma"
import { pollKommoLeads } from "@/lib/kommo-api"

export async function GET(req: Request) {
  const cronSecret = req.headers.get("authorization")
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ erro: "Não autorizado" }, { status: 401 })
  }

  try {
    // Usa o primeiro admin como userId para leads sem atendente
    const admin = await prisma.usuario.findFirst({
      where: { papel: "ADMIN", ativo: true },
      select: { id: true },
    })

    if (!admin) {
      return Response.json({ erro: "Nenhum admin encontrado" }, { status: 500 })
    }

    const result = await pollKommoLeads(admin.id)
    console.log("[cron/kommo-poll]", result)
    return Response.json({ sucesso: true, ...result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro no cron Kommo poll"
    console.error("[cron/kommo-poll]", msg)
    return Response.json({ erro: msg }, { status: 500 })
  }
}
