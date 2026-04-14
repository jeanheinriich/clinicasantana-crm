"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/actions/auth"

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="h-14 border-b px-6 flex items-center justify-between bg-background">
      <h1 className="font-semibold text-lg">{title}</h1>
      <form action={logoutAction}>
        <Button variant="ghost" size="sm" type="submit">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </form>
    </header>
  )
}
