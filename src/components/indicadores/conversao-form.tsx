"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { upsertIndicadorConversaoAction } from "@/actions/indicadores/upsert-conversao"
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
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"
import type { IndicadorConversao } from "@prisma/client"

const schema = z.object({
  totalLeads: z.string(),
  leadsTrafego: z.string(),
  leadsImpulsionar: z.string(),
  leadsRemartik: z.string(),
  leadsFC: z.string(),
  leadsLink: z.string(),
  leadsFabrica: z.string(),
  leadsTurbinar: z.string(),
  consultasAgendadas: z.string(),
  consultasRealizadas: z.string(),
})

type FormValues = z.infer<typeof schema>

interface ConversaoFormProps {
  mes: number
  ano: number
  indicador: IndicadorConversao | null
}

function toStr(v: number | null | undefined) {
  return v != null ? String(v) : "0"
}

export function ConversaoForm({ mes, ano, indicador }: ConversaoFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      totalLeads: toStr(indicador?.totalLeads),
      leadsTrafego: toStr(indicador?.leadsTrafego),
      leadsImpulsionar: toStr(indicador?.leadsImpulsionar),
      leadsRemartik: toStr(indicador?.leadsRemartik),
      leadsFC: toStr(indicador?.leadsFC),
      leadsLink: toStr(indicador?.leadsLink),
      leadsFabrica: toStr(indicador?.leadsFabrica),
      leadsTurbinar: toStr(indicador?.leadsTurbinar),
      consultasAgendadas: toStr(indicador?.consultasAgendadas),
      consultasRealizadas: toStr(indicador?.consultasRealizadas),
    },
  })

  async function onSubmit(values: FormValues) {
    const result = await upsertIndicadorConversaoAction({
      mes,
      ano,
      totalLeads: parseInt(values.totalLeads) || 0,
      leadsTrafego: parseInt(values.leadsTrafego) || 0,
      leadsImpulsionar: parseInt(values.leadsImpulsionar) || 0,
      leadsRemartik: parseInt(values.leadsRemartik) || 0,
      leadsFC: parseInt(values.leadsFC) || 0,
      leadsLink: parseInt(values.leadsLink) || 0,
      leadsFabrica: parseInt(values.leadsFabrica) || 0,
      leadsTurbinar: parseInt(values.leadsTurbinar) || 0,
      consultasAgendadas: parseInt(values.consultasAgendadas) || 0,
      consultasRealizadas: parseInt(values.consultasRealizadas) || 0,
    })
    if (result.success) {
      toast.success("Indicadores de conversão salvos!")
    } else {
      toast.error(result.error)
    }
  }

  const totalLeads = parseFloat(form.watch("totalLeads") || "0")
  const consultasRealizadas = parseFloat(form.watch("consultasRealizadas") || "0")
  const taxaConversao = totalLeads > 0 ? (consultasRealizadas / totalLeads) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Indicadores de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Taxa de conversão calculada */}
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Taxa de Conversão</span>
                <span className="font-bold text-primary">{taxaConversao.toFixed(1)}%</span>
              </div>
              <Progress value={taxaConversao} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {consultasRealizadas} realizadas / {totalLeads} leads
              </p>
            </div>

            {/* Leads por canal */}
            <div>
              <p className="text-sm font-medium mb-3">Leads por Canal</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    { name: "totalLeads",      label: "Total de Leads" },
                    { name: "leadsTrafego",    label: "Tráfego" },
                    { name: "leadsImpulsionar", label: "Impulsionar" },
                    { name: "leadsRemartik",   label: "Remartik" },
                    { name: "leadsFC",         label: "FC" },
                    { name: "leadsLink",       label: "Link" },
                    { name: "leadsFabrica",    label: "Fáb. Instagram" },
                    { name: "leadsTurbinar",   label: "Turbinar" },
                  ] as const
                ).map(({ name, label }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Consultas */}
            <div>
              <p className="text-sm font-medium mb-3">Consultas</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="consultasAgendadas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agendadas</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consultasRealizadas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Realizadas</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
