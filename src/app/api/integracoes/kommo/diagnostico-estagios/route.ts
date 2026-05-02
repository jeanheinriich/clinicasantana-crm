import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { fetchKommoPipelines } from "@/lib/kommo-api"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  if (!token || token.papel !== "ADMIN") {
    return Response.json({ erro: "Acesso restrito a administradores" }, { status: 403 })
  }

  try {
    const pipelines = await fetchKommoPipelines()
    return Response.json({ pipelines })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido"
    return Response.json({ erro: msg }, { status: 500 })
  }
}
