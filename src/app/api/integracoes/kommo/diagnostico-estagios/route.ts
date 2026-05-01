import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as { papel?: string }).papel !== "ADMIN") {
    return Response.json({ erro: "Acesso restrito a administradores" }, { status: 403 })
  }

  const config = await prisma.integracaoConfig.findUnique({ where: { servico: "KOMMO" } })
  if (!config?.accessToken) {
    return Response.json({ erro: "Token Kommo não configurado" }, { status: 400 })
  }

  const subdomain = process.env.KOMMO_SUBDOMAIN
  if (!subdomain) {
    return Response.json({ erro: "KOMMO_SUBDOMAIN não configurado" }, { status: 400 })
  }

  const res = await fetch(
    `https://${subdomain}.kommo.com/api/v4/leads/pipelines?with=statuses`,
    {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return Response.json({ erro: "Falha ao buscar estágios do Kommo", detalhe: err }, { status: res.status })
  }

  const data = await res.json() as {
    _embedded?: {
      pipelines?: Array<{
        id: number
        name: string
        is_main: boolean
        _embedded?: {
          statuses?: Array<{ id: number; name: string; type: number }>
        }
      }>
    }
  }

  const pipelines = data._embedded?.pipelines ?? []

  const resultado = pipelines.map((p) => ({
    pipeline_id:   p.id,
    pipeline_nome: p.name,
    is_main:       p.is_main,
    estagios:      (p._embedded?.statuses ?? []).map((s) => ({
      id:   s.id,
      nome: s.name,
      tipo: s.type, // 0=normal, 142=novo, 143=ganho, 144=perdido
    })),
  }))

  return Response.json({ pipelines: resultado })
}
