import { auth } from "@/auth"
import { redirect } from "next/navigation"
import type { PapelUsuario } from "@/lib/enums"
import type { Session } from "next-auth"

type Props = Record<string, unknown>

export function withAuthentication<P extends Props>(
  Component: (props: P & { session: Session }) => Promise<React.ReactElement>,
  allowedRoles?: PapelUsuario[]
) {
  return async function AuthenticatedPage(props: P) {
    const session = await auth()

    if (!session?.user) {
      redirect("/login")
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const papel = session.user.papel as PapelUsuario
      if (!allowedRoles.includes(papel)) {
        redirect("/dashboard?erro=sem-permissao")
      }
    }

    return Component({ ...props, session })
  }
}
