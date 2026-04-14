import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const isLoginPage = pathname.startsWith("/login")
  const isWebhook = pathname.startsWith("/api/webhooks")
  const isCron = pathname.startsWith("/api/cron")
  const isAuthApi = pathname.startsWith("/api/auth")

  // Rotas públicas: auth, webhooks, crons
  if (isLoginPage || isWebhook || isCron || isAuthApi) {
    return NextResponse.next()
  }

  // API routes: exige autenticação
  if (pathname.startsWith("/api") && !isLoggedIn) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  }

  // Rotas protegidas: redireciona para /login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
}
