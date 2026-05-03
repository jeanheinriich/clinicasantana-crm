"use client"

import { useState } from "react"
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type State = "idle" | "loading" | "success" | "error"

interface SyncButtonProps {
  endpoint: string
}

export function SyncButton({ endpoint }: SyncButtonProps) {
  const [state, setState] = useState<State>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleClick() {
    setState("loading")
    try {
      const res = await fetch(endpoint, { method: "POST" })
      const data = await res.json()
      if (!res.ok || data.erro) {
        setErrorMsg(data.erro ?? "Erro ao sincronizar")
        setState("error")
        setTimeout(() => setState("idle"), 5000)
      } else {
        setState("success")
        setTimeout(() => setState("idle"), 3000)
      }
    } catch {
      setErrorMsg("Falha na requisição")
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
      {state === "loading" ? "Sincronizando..." : "Sincronizar Agora"}
    </Button>
  )
}
