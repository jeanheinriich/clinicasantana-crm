"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createLeadAction } from "@/actions/leads/create"
import { updateLeadAction } from "@/actions/leads/update"
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
import type { Lead } from "@prisma/client"

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  canal: z.enum(["IMPULSIONAR", "REMARTIK", "TRAFEGO", "FC", "LINK", "FABRICA_INSTAGRAM", "TURBINAR", "OUTRO"]),
  codigoWhatsApp: z.string().optional(),
  status: z.enum(["ABORDAGEM", "EM_CONVERSA", "AGENDADO", "CONVERTIDO", "CANCELADO", "PAROU_DE_INTERAGIR", "FECHOU", "CONSULTA_FECHADA", "LEAD_PERDIDO"]),
  observacoes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface LeadFormDialogProps {
  lead?: Lead
  children?: React.ReactNode
}

const CANAIS = [
  { value: "IMPULSIONAR", label: "Impulsionar" },
  { value: "REMARTIK", label: "Remartik" },
  { value: "TRAFEGO", label: "Tráfego" },
  { value: "FC", label: "FC" },
  { value: "LINK", label: "Link" },
  { value: "FABRICA_INSTAGRAM", label: "Fáb. Instagram" },
  { value: "TURBINAR", label: "Turbinar" },
  { value: "OUTRO", label: "Outro" },
]

const STATUS_OPTIONS = [
  { value: "ABORDAGEM", label: "Abordagem" },
  { value: "EM_CONVERSA", label: "Em conversa" },
  { value: "AGENDADO", label: "Agendado" },
  { value: "CONVERTIDO", label: "Convertido" },
  { value: "CONSULTA_FECHADA", label: "Consulta fechada" },
  { value: "FECHOU", label: "Fechou" },
  { value: "PAROU_DE_INTERAGIR", label: "Parou de interagir" },
  { value: "LEAD_PERDIDO", label: "Lead perdido" },
  { value: "CANCELADO", label: "Cancelado" },
]

export function LeadFormDialog({ lead, children }: LeadFormDialogProps) {
  const [open, setOpen] = useState(false)
  const isEdit = !!lead

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: lead?.nome ?? "",
      canal: (lead?.canal as FormValues["canal"]) ?? "TRAFEGO",
      codigoWhatsApp: lead?.codigoWhatsApp ?? "",
      status: (lead?.status as FormValues["status"]) ?? "ABORDAGEM",
      observacoes: lead?.observacoes ?? "",
    },
  })

  async function onSubmit(values: FormValues) {
    const result = isEdit
      ? await updateLeadAction({ id: lead.id, ...values })
      : await createLeadAction(values)

    if (result.success) {
      toast.success(isEdit ? "Lead atualizado!" : "Lead criado!")
      setOpen(false)
      form.reset()
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
            Novo Lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do lead" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="canal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Canal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CANAIS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
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
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
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
              name="codigoWhatsApp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: A3675" {...field} />
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
                    <Textarea
                      placeholder="Observações sobre o lead..."
                      rows={3}
                      {...field}
                    />
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
