import type { PapelUsuario } from "@/lib/enums"

export type Modulo =
  | "dashboard"
  | "leads"
  | "consultas"
  | "vendas"
  | "financeiro"
  | "usuarios"
  | "integracoes"
  | "indicadores"
  | "campanhas"

export type NivelAcesso = "none" | "view" | "edit" | "full"

const PERMISSOES: Record<PapelUsuario, Record<Modulo, NivelAcesso>> = {
  ADMIN: {
    dashboard: "edit",
    leads: "full",
    consultas: "full",
    vendas: "full",
    financeiro: "full",
    usuarios: "full",
    integracoes: "full",
    indicadores: "full",
    campanhas: "full",
  },
  GESTOR: {
    dashboard: "edit",
    leads: "full",
    consultas: "full",
    vendas: "full",
    financeiro: "view",
    usuarios: "none",
    integracoes: "none",
    indicadores: "full",
    campanhas: "view",
  },
  ATENDENTE: {
    dashboard: "view",
    leads: "full",
    consultas: "view",
    vendas: "view",
    financeiro: "none",
    usuarios: "none",
    integracoes: "none",
    indicadores: "none",
    campanhas: "none",
  },
  VISUALIZADOR: {
    dashboard: "view",
    leads: "none",
    consultas: "none",
    vendas: "none",
    financeiro: "view",
    usuarios: "none",
    integracoes: "none",
    indicadores: "view",
    campanhas: "none",
  },
}

const NIVEIS: NivelAcesso[] = ["none", "view", "edit", "full"]

export function temPermissao(
  papel: PapelUsuario,
  modulo: Modulo,
  nivelRequerido: NivelAcesso
): boolean {
  const nivelAtual = PERMISSOES[papel][modulo]
  return NIVEIS.indexOf(nivelAtual) >= NIVEIS.indexOf(nivelRequerido)
}

export function getNivelAcesso(papel: PapelUsuario, modulo: Modulo): NivelAcesso {
  return PERMISSOES[papel][modulo]
}
