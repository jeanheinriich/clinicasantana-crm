import { z } from "zod"

export const LeadImportRowSchema = z.object({
  nome: z.string().min(1),
  canal: z.enum(["IMPULSIONAR", "REMARTIK", "TRAFEGO", "FC", "LINK", "FABRICA_INSTAGRAM", "TURBINAR", "OUTRO"]),
  codigoWhatsApp: z.string().optional(),
  status: z
    .enum(["ABORDAGEM", "EM_CONVERSA", "AGENDADO", "CONVERTIDO", "CANCELADO", "PAROU_DE_INTERAGIR", "FECHOU", "CONSULTA_FECHADA", "LEAD_PERDIDO"])
    .default("ABORDAGEM"),
  observacoes: z.string().optional(),
})

export type LeadImportRow = z.infer<typeof LeadImportRowSchema>
