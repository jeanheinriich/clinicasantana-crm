"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type State = "idle" | "loading" | "success" | "error"

interface SyncButtonProps {
  endpoint: string
  label?: string
}

export function SyncButton({ endpoint, label = "Sincronizar Agora" }: SyncButtonProps) {
  const [state, setState] = useState<State>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const router = useRouter()

  async function handleClick() {
    setState("loading")
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12_000)
    try {
      const res = await fetch(endpoint, { method: "POST", signal: controller.signal })
      clearTimeout(timer)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || (data as { erro?: string }).erro) {
        setErrorMsg((data as { erro?: string }).erro ?? `Erro ${res.status}`)
        setState("error")
        setTimeout(() => setState("idle"), 5000)
      } else {
        setState("success")
        router.refresh()
        setTimeout(() => setState("idle"), 3000)
      }
    } catch (e) {
      clearTimeout(timer)
      const isTimeout = e instanceof Error && e.name === "AbortError"
      setErrorMsg(isTimeout ? "Tempo limite excedido" : "Falha na requisição")
      setState("error")
      setTimeout(() => setState("idle"), 5000)
    }
  }

  if (state === "success") {
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--status-ok)" }}>
        <CheckCircle2 className="h-4 w-4" />
        Sincronizado!
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium text-destructive">
        <AlertCircle className="h-4 w-4" />
        {errorMsg}
      </div>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={state === "loading"}>
      <RefreshCw className={`h-4 w-4 mr-2 ${state === "loading" ? "animate-spin" : ""}`} />
      {state === "loading" ? "Aguardando..." : label}
    </Button>
  )
}
