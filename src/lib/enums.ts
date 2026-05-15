// Tipos que substituem os enums do Prisma (SQLite não suporta enums nativos)

export type PapelUsuario = "ADMIN" | "GESTOR" | "ATENDENTE" | "VISUALIZADOR"
export type CanalLead = "IMPULSIONAR" | "REMARTIK" | "TRAFEGO" | "FC" | "LINK" | "FABRICA_INSTAGRAM" | "TURBINAR" | "OUTRO"
export type StatusLead = "ABORDAGEM" | "EM_CONVERSA" | "AGENDADO" | "CONVERTIDO" | "CANCELADO" | "PAROU_DE_INTERAGIR" | "FECHOU" | "CONSULTA_FECHADA" | "LEAD_PERDIDO"
export type OrigemConsulta = "FC" | "LINK" | "TRAFEGO" | "RECORRENCIA" | "REMARTIK" | "IMPULSIONAR"
export type StatusConsulta = "REALIZADA" | "CANCELADA" | "PENDENTE"
export type StatusVenda = "PENDENTE" | "REALIZADA" | "CANCELADA"
