"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { upsertIndicadorComercialAction } from "@/actions/indicadores/upsert-comercial"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
type IndicadorComercialSerializavel = {
  id: string
  mes: number
  ano: number
  agendamentosNovosQtd: number
  agendamentosNovosValor: number
  recorrenciaQtd: number
  recorrenciaValor: number
}

const schema = z.object({
  agendamentosNovosQtd: z.string(),
  agendamentosNovosValor: z.string(),
  recorrenciaQtd: z.string(),
  recorrenciaValor: z.string(),
})

type FormValues = z.infer<typeof schema>

interface ComercialFormProps {
  mes: number
  ano: number
  indicador: IndicadorComercialSerializavel | null
}

export function ComercialForm({ mes, ano, indicador }: ComercialFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      agendamentosNovosQtd: indicador ? String(indicador.agendamentosNovosQtd) : "0",
      agendamentosNovosValor: indicador ? String(indicador.agendamentosNovosValor) : "0",
      recorrenciaQtd: indicador ? String(indicador.recorrenciaQtd) : "0",
      recorrenciaValor: indicador ? String(indicador.recorrenciaValor) : "0",
    },
  })

  async function onSubmit(values: FormValues) {
    const result = await upsertIndicadorComercialAction({
      mes,
      ano,
      agendamentosNovosQtd: parseInt(values.agendamentosNovosQtd) || 0,
      agendamentosNovosValor: parseFloat(values.agendamentosNovosValor.replace(",", ".")) || 0,
      recorrenciaQtd: parseInt(values.recorrenciaQtd) || 0,
      recorrenciaValor: parseFloat(values.recorrenciaValor.replace(",", ".")) || 0,
    })
    if (result.success) {
      toast.success("Indicadores comerciais salvos!")
    } else {
      toast.error(result.error)
    }
  }

  const qtdNovos = parseFloat(form.watch("agendamentosNovosQtd") || "0")
  const valorNovos = parseFloat(form.watch("agendamentosNovosValor") || "0")
  const qtdRec = parseFloat(form.watch("recorrenciaQtd") || "0")
  const valorRec = parseFloat(form.watch("recorrenciaValor") || "0")

  const ticketNovos = qtdNovos > 0 ? valorNovos / qtdNovos : 0
  const ticketRec = qtdRec > 0 ? valorRec / qtdRec : 0

  const formatBRL = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agendamentos e Recorrência</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Novos</p>
                <FormField
                  control={form.control}
                  name="agendamentosNovosQtd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qtd. Agendamentos</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="agendamentosNovosValor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total (R$)</FormLabel>
                      <FormControl>
                        <Input placeholder="0,00" inputMode="decimal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Ticket médio: <span className="font-semibold text-foreground">{formatBRL(ticketNovos)}</span>
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Recorrência</p>
                <FormField
                  control={form.control}
                  name="recorrenciaQtd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qtd. Recorrência</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recorrenciaValor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total (R$)</FormLabel>
                      <FormControl>
                        <Input placeholder="0,00" inputMode="decimal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Ticket médio: <span className="font-semibold text-foreground">{formatBRL(ticketRec)}</span>
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
