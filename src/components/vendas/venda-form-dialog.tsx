"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createVendaAction } from "@/actions/vendas/create"
import { updateVendaAction } from "@/actions/vendas/update"
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
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus } from "lucide-react"

export type ConsultaOpcao = {
  id: string
  nomeCliente: string
  dataConsulta: Date
  origem: string
}

type VendaSerializavel = {
  id: string
  consultaId: string
  valor: number
  dataVenda: Date
  status: string
  observacao?: string | null
}

const schema = z.object({
  consultaId: z.string().min(1, "Selecione uma consulta"),
  valor: z.string().min(1, "Valor é obrigatório"),
  dataVenda: z.string().min(1, "Data da venda é obrigatória"),
  status: z.enum(["PENDENTE", "REALIZADA", "CANCELADA"]),
  observacao: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const STATUS_OPTIONS = [
  { value: "PENDENTE",   label: "Pendente"   },
  { value: "REALIZADA",  label: "Realizada"  },
  { value: "CANCELADA",  label: "Cancelada"  },
]

function toDateInput(date?: Date | null): string {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

function formatDateBR(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR")
}

interface VendaFormDialogProps {
  venda?: VendaSerializavel
  consultas: ConsultaOpcao[]
  children?: React.ReactNode
}

export function VendaFormDialog({ venda, consultas, children }: VendaFormDialogProps) {
  const [open, setOpen] = useState(false)
  const isEdit = !!venda

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      consultaId: venda?.consultaId ?? "",
      valor: venda?.valor != null ? String(venda.valor) : "",
      dataVenda: toDateInput(venda?.dataVenda),
      status: (venda?.status as FormValues["status"]) ?? "PENDENTE",
      observacao: venda?.observacao ?? "",
    },
  })

  const consultaIdWatch = form.watch("consultaId")
  const consultaSelecionada = consultas.find((c) => c.id === consultaIdWatch)
  const tipoConsulta = consultaSelecionada
    ? consultaSelecionada.origem === "RECORRENCIA" ? "Recorrente" : "Novo"
    : null

  async function onSubmit(values: FormValues) {
    const valor = parseFloat(values.valor.replace(",", "."))
    if (isNaN(valor) || valor <= 0) {
      form.setError("valor", { message: "Valor inválido" })
      return
    }

    const payload = {
      consultaId: values.consultaId,
      valor,
      dataVenda: new Date(values.dataVenda),
      status: values.status,
      observacao: values.observacao || undefined,
    }

    const result = isEdit
      ? await updateVendaAction({ id: venda!.id, ...payload })
      : await createVendaAction(payload)

    if (result.success) {
      toast.success(isEdit ? "Venda atualizada!" : "Venda registrada!")
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
            Nova Venda
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Venda" : "Nova Venda"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="consultaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consulta / Cliente</FormLabel>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma consulta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-64">
                        {consultas.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nomeCliente} — {formatDateBR(c.dataConsulta)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {tipoConsulta && (
                      <Badge variant={tipoConsulta === "Recorrente" ? "secondary" : "outline"}>
                        {tipoConsulta}
                      </Badge>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="0,00" inputMode="decimal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataVenda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Venda</FormLabel>
                    <FormControl>
                      <Input type="date" max={new Date().toISOString().split("T")[0]} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
            <FormField
              control={form.control}
              name="observacao"
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
                {isEdit ? "Salvar" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
