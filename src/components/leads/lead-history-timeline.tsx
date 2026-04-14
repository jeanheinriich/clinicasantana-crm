"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { addLeadInteracaoAction } from "@/actions/leads/add-interacao"
import { formatDateTime } from "@/lib/utils"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, MessageSquare, Send } from "lucide-react"
import type { LeadInteracao } from "@prisma/client"

const schema = z.object({
  descricao: z.string().min(1, "Digite a interação"),
})

interface LeadHistoryTimelineProps {
  leadId: string
  interacoes: LeadInteracao[]
}

export function LeadHistoryTimeline({ leadId, interacoes }: LeadHistoryTimelineProps) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { descricao: "" },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    const result = await addLeadInteracaoAction({ leadId, descricao: values.descricao })
    if (result.success) {
      toast.success("Interação registrada!")
      form.reset()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Histórico de Interações
      </h3>

      {/* New interaction form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    placeholder="Registrar nova interação..."
                    rows={2}
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            size="icon"
            disabled={form.formState.isSubmitting}
            className="self-start mt-0.5"
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </Form>

      {/* Timeline */}
      <div className="space-y-3">
        {interacoes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma interação registrada ainda.
          </p>
        )}
        {interacoes.map((interacao) => (
          <div
            key={interacao.id}
            className="flex gap-3 text-sm border-l-2 border-muted pl-3 py-1"
          >
            <div className="flex-1">
              <p className="text-muted-foreground text-xs mb-1">
                {formatDateTime(interacao.criadoEm)}
              </p>
              <p className="whitespace-pre-wrap">{interacao.descricao}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
