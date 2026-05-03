import { auth } from "@/auth"
import { exchangeCodeForToken } from "@/lib/meta-api"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ erro: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/integracoes/meta?erro=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/integracoes/meta?erro=codigo_ausente`
    )
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/integracoes/meta/callback`
    await exchangeCodeForToken(code, redirectUri)
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/integracoes/meta?sucesso=conectado`
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido"
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/integracoes/meta?erro=${encodeURIComponent(msg)}`
    )
  }
}
