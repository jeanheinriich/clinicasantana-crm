import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MobileHeader } from "@/components/layout/mobile-header"
import type { PapelUsuario } from "@/lib/enums"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar
          papel={session.user.papel as PapelUsuario}
          nomeUsuario={session.user.name ?? session.user.email ?? ""}
        />
        <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <MobileHeader />
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
