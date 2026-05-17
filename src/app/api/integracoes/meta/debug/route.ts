import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ erro: "Sem permissão" }, { status: 403 })
  }

  const config = await prisma.integracaoConfig.findUnique({ where: { servico: "META" } })
  if (!config?.accessToken) return Response.json({ erro: "Token não configurado" })

  const base = "https://graph.facebook.com/v21.0"
  const token = config.accessToken

  const [permRes, accountsRes] = await Promise.all([
    fetch(`${base}/me/permissions?access_token=${token}`),
    fetch(`${base}/me/accounts?fields=id,name,instagram_business_account&access_token=${token}`),
  ])

  const [permissions, accounts] = await Promise.all([permRes.json(), accountsRes.json()])

  // Tenta buscar instagram_business_account de cada página individualmente
  const pages = (accounts.data ?? []) as Array<{ id: string; name: string }>
  const pagesDetail = await Promise.all(
    pages.map(async (p) => {
      const r = await fetch(`${base}/${p.id}?fields=instagram_business_account&access_token=${token}`)
      return { pageId: p.id, name: p.name, detail: await r.json() }
    })
  )

  return Response.json({
    extraData:   config.extraData,
    permissions: permissions?.data,
    pagesDetail,
  })
}
