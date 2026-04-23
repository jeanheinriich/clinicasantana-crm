"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Users,
  Calendar,
  TrendingUp,
  BarChart3,
  ArrowRightLeft,
  Plug,
  UserCog,
  Megaphone,
  LogOut,
} from "lucide-react"
import type { PapelUsuario } from "@/lib/enums"
import { temPermissao } from "@/lib/permissions"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  modulo: Parameters<typeof temPermissao>[1]
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",            label: "Dashboard",                 icon: LayoutDashboard, modulo: "dashboard"   },
  { href: "/leads",                label: "Leads",                     icon: Users,           modulo: "leads"       },
  { href: "/consultas",            label: "Consultas",                 icon: Calendar,        modulo: "consultas"   },
  { href: "/financeiro/metas",     label: "Metas Financeiras",         icon: TrendingUp,      modulo: "financeiro"  },
  { href: "/indicadores/comercial",label: "Indicadores Comerciais",    icon: BarChart3,       modulo: "indicadores" },
  { href: "/indicadores/conversao",label: "Indicadores de Conversão",  icon: ArrowRightLeft,  modulo: "indicadores" },
  { href: "/campanhas",            label: "Campanhas Meta",            icon: Megaphone,       modulo: "campanhas"   },
  { href: "/integracoes/meta",     label: "Integrações",               icon: Plug,            modulo: "integracoes" },
  { href: "/usuarios",             label: "Usuários",                  icon: UserCog,         modulo: "usuarios"    },
]

interface AppSidebarProps {
  papel: PapelUsuario
  nomeUsuario: string
}

export function AppSidebar({ papel, nomeUsuario }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { openMobile, setOpenMobile } = useSidebar()

  const visibleItems = NAV_ITEMS.filter((item) =>
    temPermissao(papel, item.modulo, "view")
  )

  const closeMobile = () => setOpenMobile(false)

  return (
    <>
      {/* Mobile backdrop */}
      {openMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col",
          "border-r border-sidebar-border bg-sidebar",
          "transition-transform duration-300 ease-in-out",
          // Desktop: static in flex flow, always visible, full viewport height
          "md:static md:z-auto md:h-svh md:translate-x-0 md:shrink-0",
          // Mobile: slide in/out
          openMobile ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold leading-tight text-foreground">
              Clínica Santana
            </span>
            <span className="truncate text-xs text-muted-foreground">{nomeUsuario}</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={
                        isActive
                          ? "border-l-2 border-[hsl(36,55%,45%)] bg-[hsl(36,45%,92%)] text-[hsl(30,20%,15%)] font-medium rounded-l-none pl-[calc(0.5rem-2px)]"
                          : "border-l-2 border-transparent text-[hsl(30,10%,45%)] hover:bg-[hsl(36,20%,93%)] hover:text-[hsl(30,15%,20%)] transition-colors duration-150"
                      }
                    >
                      <Link href={item.href} onClick={closeMobile}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  closeMobile()
                  signOut({ redirect: false }).then(() => router.push("/login"))
                }}
                tooltip="Sair"
                className="text-sidebar-foreground hover:text-sidebar-accent-foreground"
              >
                <LogOut />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <p className="px-1 text-xs text-sidebar-foreground">{papel}</p>
        </SidebarFooter>
      </aside>
    </>
  )
}
