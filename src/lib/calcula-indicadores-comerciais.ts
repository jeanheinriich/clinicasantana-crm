import { prisma } from "@/lib/prisma"

export async function calcularIndicadoresComerciais(mes: number, ano: number) {
  const consultas = await prisma.consulta.findMany({
    where: { mesPagamento: mes, anoPagamento: ano, dataPagamento: { not: null }, status: { not: "CANCELADA" } },
    select: { valor: true, origem: true, status: true },
  })

  const novos      = consultas.filter((c) => c.origem !== "RECORRENCIA")
  const recorrentes = consultas.filter((c) => c.origem === "RECORRENCIA")

  // Numeradores: todos não-cancelados com dataPagamento (já filtrado pela query)
  const agendNovosQtd    = novos.length
  const agendNovosValor  = novos.reduce((s, c) => s + Number(c.valor ?? 0), 0)
  const recorrenciaQtd   = recorrentes.length
  const recorrenciaValor = recorrentes.reduce((s, c) => s + Number(c.valor ?? 0), 0)

  // Denominadores de ticket: apenas REALIZADAS
  const novosRealizados       = novos.filter((c) => c.status === "REALIZADA")
  const recorrentesRealizados = recorrentes.filter((c) => c.status === "REALIZADA")
  const ticketNovosQtd        = novosRealizados.length
  const ticketRecQtd          = recorrentesRealizados.length
  const totalQtd              = consultas.filter((c) => c.status === "REALIZADA").length

  return {
    agendNovosQtd,
    agendNovosValor,
    agendNovosTicket: ticketNovosQtd > 0 ? agendNovosValor / ticketNovosQtd : 0,
    recorrenciaQtd,
    recorrenciaValor,
    recorrenciaTicket: ticketRecQtd > 0 ? recorrenciaValor / ticketRecQtd : 0,
    totalQtd,
    ticketNovosQtd,
    ticketNovosValor: agendNovosValor,
    ticketRecQtd,
    ticketRecValor:   recorrenciaValor,
  }
}
