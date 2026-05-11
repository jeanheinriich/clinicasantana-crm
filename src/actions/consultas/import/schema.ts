import { z } from "zod"

function parseLocalDate(v: string): Date {
  // "YYYY-MM-DD" → local midnight (avoid UTC-offset shifting the day)
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return new Date(v)
}

export const ConsultaImportRowSchema = z.object({
  nomeCliente: z.string().min(1),
  dataConsulta: z.string().transform(parseLocalDate),
  dataPagamento: z
    .string()
    .transform((v) => (v.trim() === "" ? null : parseLocalDate(v)))
    .optional()
    .nullable(),
  origem: z.enum(["FC", "LINK", "TRAFEGO", "RECORRENCIA", "REMARTIK", "IMPULSIONAR"]),
  valor: z
    .string()
    .optional()
    .nullable()
    .transform((v) => {
      if (!v) return null
      const num = parseFloat(v.replace(/[R$\s.]/g, "").replace(",", "."))
      return isNaN(num) ? null : num
    }),
  valorProcedimento: z
    .string()
    .optional()
    .nullable()
    .transform((v) => {
      if (!v) return null
      const num = parseFloat(v.replace(/[R$\s.]/g, "").replace(",", "."))
      return isNaN(num) ? null : num
    }),
  status: z
    .enum(["REALIZADA", "CANCELADA", "PENDENTE"])
    .default("REALIZADA"),
})

export type ConsultaImportRow = z.infer<typeof ConsultaImportRowSchema>
