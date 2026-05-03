"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createConsultaAction } from "@/actions/consultas/create"
import { updateConsultaAction } from "@/actions/consultas/update"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
// Tipo serializável (sem Prisma.Decimal) para passar de Server → Client Component
type ConsultaSerializavel = {
  id: string
  nomeCliente: string
  dataConsulta: Date
  dataPagamento?: Date | null
  origem: string
  valor?: number | null
  status: string
  observacoes?: string | null
  mes: number
  ano: number
  leadId?: string | null
}

const schema = z.object({
  nomeCliente: z.string().min(1, "Nome do cliente é obrigatório"),
  dataConsulta: z.string().min(1, "Data da consulta é obrigatória"),
  dataPagamento: z.string().optional(),
  origem: z.enum(["FC", "LINK", "TRAFEGO", "TRAFEGO_RECORRENCIA", "REMARTIK"]),
  valor: z.string().optional(),
  status: z.enum(["REALIZADA", "CANCELADA", "PENDENTE"]),
  observacoes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const ORIGENS = [
  { value: "FC", label: "FC" },
  { value: "LINK", label: "Link" },
  { value: "TRAFEGO", label: "Tráfego" },
  { value: "TRAFEGO_RECORRENCIA", label: "Tráfego Recorrência" },
  { value: "REMARTIK", label: "Remartik" },
]

const STATUS_OPTIONS = [
  { value: "REALIZADA", label: "Realizada" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "CANCELADA", label: "Cancelada" },
]

function toDateInput(date?: Date | null): string {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

interface ConsultaFormDialogProps {
  consulta?: ConsultaSerializavel
  children?: React.ReactNode
}

export function ConsultaFormDialog({ consulta, children }: ConsultaFormDialogProps) {
  const [open, setOpen] = useState(false)
  const isEdit = !!consulta

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomeCliente: consulta?.nomeCliente ?? "",
      dataConsulta: toDateInput(consulta?.dataConsulta),
      dataPagamento: toDateInput(consulta?.dataPagamento),
      origem: (consulta?.origem as FormValues["origem"]) ?? "FC",
      valor: consulta?.valor != null ? String(consulta.valor) : "",
      status: (consulta?.status as FormValues["status"]) ?? "PENDENTE",
      observacoes: consulta?.observacoes ?? "",
    },
  })

  async function onSubmit(values: FormValues) {
    const payload = {
      nomeCliente: values.nomeCliente,
      dataConsulta: new Date(values.dataConsulta),
      dataPagamento: values.dataPagamento ? new Date(values.dataPagamento) : null,
      origem: values.origem,
      status: values.status,
      observacoes: values.observacoes,
      valor: values.valor ? parseFloat(values.valor.replace(",", ".")) : undefined,
    }

    const result = isEdit
      ? await updateConsultaAction({ id: consulta!.id, ...payload })
      : await createConsultaAction(payload)

    if (result.success) {
      toast.success(isEdit ? "Consulta atualizada!" : "Consulta criada!")
      setOpen(false)
      if (!isEdit) form.reset()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" className="bg-[hsl(30,20%,15%)] text-white hover:bg-[hsl(30,20%,25%)]">
            <Plus className="h-4 w-4 mr-2" />
            Nova Consulta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Consulta" : "Nova Consulta"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nomeCliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="dataConsulta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Consulta</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Pagamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="origem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Origem" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORIGENS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="0,00"
                      inputMode="decimal"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Observações..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-[hsl(30,20%,15%)] text-white hover:bg-[hsl(30,20%,25%)]"
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
