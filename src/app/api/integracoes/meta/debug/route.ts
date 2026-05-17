import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.papel !== "ADMIN") {
    return Response.json({ erro: "Sem permissão" }, { status: 403 })
  }

  const config = await prisma.integracaoConfig.findUnique({ where: { servico: "META" } })
  if (!config?.accessToken) return Response.json({ erro: "Token não configurado" })

  const url = new URL("https://graph.facebook.com/v21.0/me/accounts")
  url.searchParams.set("fields", "id,name,instagram_business_account")
  url.searchParams.set("access_token", config.accessToken)

  const res  = await fetch(url.toString())
  const data = await res.json()

  return Response.json({
    extraData:     config.extraData,
    accountsRaw:   data,
  })
}
