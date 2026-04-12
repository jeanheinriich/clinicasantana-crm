"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { upsertMetaFinanceiraAction } from "@/actions/metas/upsert"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Target } from "lucide-react"
type MetaFinanceiraSerializavel = {
  id: string
  mes: number
  ano: number
  metaAceitavel: number
  metaIdeal: number
  superMeta: number
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const schema = z.object({
  metaAceitavel: z.string().min(1, "Obrigatório"),
  metaIdeal: z.string().min(1, "Obrigatório"),
  superMeta: z.string().min(1, "Obrigatório"),
})

type FormValues = z.infer<typeof schema>

interface MetaFinanceiraFormProps {
  mes: number
  ano: number
  metaAtual: MetaFinanceiraSerializavel | null
  children?: React.ReactNode
}

export function MetaFinanceiraForm({ mes, ano, metaAtual, children }: MetaFinanceiraFormProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      metaAceitavel: metaAtual ? String(metaAtual.metaAceitavel) : "",
      metaIdeal: metaAtual ? String(metaAtual.metaIdeal) : "",
      superMeta: metaAtual ? String(metaAtual.superMeta) : "",
    },
  })

  async function onSubmit(values: FormValues) {
    const result = await upsertMetaFinanceiraAction({
      mes,
      ano,
      metaAceitavel: parseFloat(values.metaAceitavel.replace(",", ".")),
      metaIdeal: parseFloat(values.metaIdeal.replace(",", ".")),
      superMeta: parseFloat(values.superMeta.replace(",", ".")),
    })
    if (result.success) {
      toast.success("Meta salva com sucesso!")
      setOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" className="bg-[hsl(30,20%,15%)] text-white hover:bg-[hsl(30,20%,25%)]">
            <Target className="h-4 w-4 mr-2" />
            {metaAtual ? "Editar Meta" : "Configurar Meta"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Meta — {MESES[mes - 1]} {ano}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="metaAceitavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Aceitável (R$)</FormLabel>
                  <FormControl>
                    <Input placeholder="0,00" inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="metaIdeal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Ideal (R$)</FormLabel>
                  <FormControl>
                    <Input placeholder="0,00" inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="superMeta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Super Meta (R$)</FormLabel>
                  <FormControl>
                    <Input placeholder="0,00" inputMode="decimal" {...field} />
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
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
