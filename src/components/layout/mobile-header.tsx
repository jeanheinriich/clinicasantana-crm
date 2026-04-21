"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
      <SidebarTrigger className="h-9 w-9" />
      <span className="text-sm font-semibold text-foreground">Clínica Santana</span>
    </header>
  )
}
