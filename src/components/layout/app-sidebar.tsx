"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
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
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  modulo: Parameters<typeof temPermissao>[1]
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, modulo: "dashboard" },
  { href: "/leads", label: "Leads", icon: Users, modulo: "leads" },
  { href: "/consultas", label: "Consultas", icon: Calendar, modulo: "consultas" },
  { href: "/financeiro/metas", label: "Metas Financeiras", icon: TrendingUp, modulo: "financeiro" },
  { href: "/indicadores/comercial", label: "Indicadores Comerciais", icon: BarChart3, modulo: "indicadores" },
  { href: "/indicadores/conversao", label: "Indicadores de Conversão", icon: ArrowRightLeft, modulo: "indicadores" },
  { href: "/campanhas", label: "Campanhas Meta", icon: Megaphone, modulo: "campanhas" },
  { href: "/integracoes/meta", label: "Integrações", icon: Plug, modulo: "integracoes" },
  { href: "/usuarios", label: "Usuários", icon: UserCog, modulo: "usuarios" },
]

interface AppSidebarProps {
  papel: PapelUsuario
  nomeUsuario: string
}

export function AppSidebar({ papel, nomeUsuario }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const visibleItems = NAV_ITEMS.filter((item) =>
    temPermissao(papel, item.modulo, "view")
  )

  return (
    <Sidebar collapsible="none" className="border-r border-sidebar-border shrink-0">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
          <span className="font-semibold text-foreground text-sm leading-tight">
            Clínica Santana
          </span>
          <span className="text-xs text-muted-foreground truncate">{nomeUsuario}</span>
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
                        ? "border-l-2 border-[hsl(var(--sidebar-active-border))] bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-fg))] rounded-l-none pl-[calc(0.5rem-2px)]"
                        : "hover:bg-[hsl(var(--sidebar-hover-bg))]"
                    }
                  >
                    <Link href={item.href}>
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
              onClick={() => signOut({ redirect: false }).then(() => router.push("/login"))}
              tooltip="Sair"
              className="text-sidebar-foreground hover:text-sidebar-accent-foreground"
            >
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <p className="text-xs text-sidebar-foreground px-1 group-data-[collapsible=icon]:hidden">
          {papel}
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
