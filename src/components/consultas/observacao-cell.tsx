"use client"

import { MessageSquare } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Props {
  observacoes: string | null
}

export function ObservacaoCell({ observacoes }: Props) {
  if (!observacoes) return null

  const preview = observacoes.length > 100 ? observacoes.slice(0, 100) + "…" : observacoes

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <Popover>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <MessageSquare className="h-4 w-4" />
                <span className="sr-only">Ver observação</span>
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="whitespace-pre-wrap">{preview}</p>
          </TooltipContent>
          <PopoverContent side="top" className="max-w-sm text-sm whitespace-pre-wrap">
            {observacoes}
          </PopoverContent>
        </Popover>
      </Tooltip>
    </TooltipProvider>
  )
}
