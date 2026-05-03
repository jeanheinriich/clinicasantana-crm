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
import { useSidebar } from "@/components/ui/sidebar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  modulo: Parameters<typeof temPermissao>[1]
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",              label: "Dashboard",                 icon: LayoutDashboard, modulo: "dashboard"   },
  { href: "/leads",                  label: "Leads",                     icon: Users,           modulo: "leads"       },
  { href: "/consultas",              label: "Consultas",                 icon: Calendar,        modulo: "consultas"   },
  { href: "/financeiro/metas",       label: "Metas Financeiras",         icon: TrendingUp,      modulo: "financeiro"  },
  { href: "/indicadores/comercial",  label: "Indicadores Comerciais",    icon: BarChart3,       modulo: "indicadores" },
  { href: "/indicadores/conversao",  label: "Indicadores de Conversão",  icon: ArrowRightLeft,  modulo: "indicadores" },
  { href: "/campanhas",              label: "Campanhas Meta",            icon: Megaphone,       modulo: "campanhas"   },
  { href: "/usuarios",               label: "Usuários",                  icon: UserCog,         modulo: "usuarios"    },
]

const INTEGRACOES_ITEMS: NavItem[] = [
  { href: "/integracoes/meta",  label: "Meta Ads",  icon: Megaphone, modulo: "integracoes" },
  { href: "/integracoes/kommo", label: "Kommo CRM", icon: Plug,      modulo: "integracoes" },
]

interface AppSidebarProps {
  papel: PapelUsuario
  nomeUsuario: string
}

interface NavContentProps {
  papel: PapelUsuario
  nomeUsuario: string
  onNavigate?: () => void
}

function NavContent({ papel, nomeUsuario, onNavigate }: NavContentProps) {
  const pathname = usePathname()
  const router = useRouter()

  const visibleItems = NAV_ITEMS.filter((item) =>
    temPermissao(papel, item.modulo, "view")
  )
  const showIntegracoes = temPermissao(papel, "integracoes", "view")

  const linkClass = (href: string) => {
    const isActive = pathname === href || pathname.startsWith(href + "/")
    return [
      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-150",
      "border-l-2",
      isActive
        ? "border-[hsl(36,55%,45%)] bg-[hsl(36,45%,92%)] text-[hsl(30,20%,15%)] font-medium rounded-l-none pl-[calc(0.75rem-2px)]"
        : "border-transparent text-[hsl(30,10%,45%)] hover:bg-[hsl(36,20%,93%)] hover:text-[hsl(30,15%,20%)]",
    ].join(" ")
  }

  return (
    <>
      <div className="border-b border-sidebar-border px-4 py-4">
        <span className="block font-semibold text-foreground text-sm leading-tight">
          Clínica Santana
        </span>
        <span className="block text-xs text-muted-foreground truncate">{nomeUsuario}</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-0.5 px-2">
          {visibleItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link href={item.href} onClick={onNavigate} className={linkClass(item.href)}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}

          {showIntegracoes && (
            <>
              {/* Separador visual */}
              <li className="pt-2 pb-0.5">
                <div className="flex items-center gap-1.5 px-3 py-1">
                  <Plug className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                    Integrações
                  </span>
                </div>
              </li>
              {INTEGRACOES_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link href={item.href} onClick={onNavigate} className={linkClass(item.href)}>
                      <span className="w-4 flex justify-center shrink-0 text-muted-foreground/40 text-xs">└</span>
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </>
          )}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => signOut({ redirect: false }).then(() => router.push("/login"))}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-[hsl(36,20%,93%)] hover:text-[hsl(30,15%,20%)] transition-colors duration-150"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sair</span>
        </button>
        <p className="mt-1 px-3 text-xs text-muted-foreground">{papel}</p>
      </div>
    </>
  )
}

export function AppSidebar({ papel, nomeUsuario }: AppSidebarProps) {
  const { openMobile, setOpenMobile } = useSidebar()

  return (
    <>
      {/* Desktop: static flex item — never fixed, never overlaps */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col bg-sidebar border-r border-sidebar-border">
        <NavContent papel={papel} nomeUsuario={nomeUsuario} />
      </aside>

      {/* Mobile: Sheet drawer via portal */}
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col flex-1 overflow-hidden">
            <NavContent
              papel={papel}
              nomeUsuario={nomeUsuario}
              onNavigate={() => setOpenMobile(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
