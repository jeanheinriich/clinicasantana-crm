import { LoginForm } from "@/components/auth/login-form"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <div className="w-full max-w-md px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Clínica Santana</h1>
        <p className="text-muted-foreground mt-1">Acesse o painel de gestão</p>
      </div>
      <LoginForm />
    </div>
  )
}
