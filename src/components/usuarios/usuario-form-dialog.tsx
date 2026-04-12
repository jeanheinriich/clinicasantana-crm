"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createUsuarioAction } from "@/actions/usuarios/create"
import { updateUsuarioAction } from "@/actions/usuarios/update"
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
import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
import type { Usuario } from "@prisma/client"

const PAPEIS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "GESTOR", label: "Gestor" },
  { value: "ATENDENTE", label: "Atendente" },
  { value: "VISUALIZADOR", label: "Visualizador" },
]

const schemaCreate = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Mínimo 6 caracteres"),
  papel: z.enum(["ADMIN", "GESTOR", "ATENDENTE", "VISUALIZADOR"]),
})

const schemaEdit = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6).optional().or(z.literal("")),
  papel: z.enum(["ADMIN", "GESTOR", "ATENDENTE", "VISUALIZADOR"]),
})

type CreateValues = z.infer<typeof schemaCreate>
type EditValues = z.infer<typeof schemaEdit>

interface UsuarioFormDialogProps {
  usuario?: Usuario
  children?: React.ReactNode
}

export function UsuarioFormDialog({ usuario, children }: UsuarioFormDialogProps) {
  const [open, setOpen] = useState(false)
  const isEdit = !!usuario

  const form = useForm<CreateValues | EditValues>({
    resolver: zodResolver(isEdit ? schemaEdit : schemaCreate),
    defaultValues: {
      nome: usuario?.nome ?? "",
      email: usuario?.email ?? "",
      senha: "",
      papel: (usuario?.papel as CreateValues["papel"]) ?? "ATENDENTE",
    },
  })

  async function onSubmit(values: CreateValues | EditValues) {
    const result = isEdit
      ? await updateUsuarioAction({
          id: usuario.id,
          nome: values.nome,
          email: values.email,
          papel: values.papel,
          ...(values.senha ? { senha: values.senha } : {}),
        })
      : await createUsuarioAction(values as CreateValues)

    if (result.success) {
      toast.success(isEdit ? "Usuário atualizado!" : "Usuário criado!")
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
            Novo Usuário
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEdit ? "Nova Senha (opcional)" : "Senha"}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="papel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Papel</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAPEIS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
