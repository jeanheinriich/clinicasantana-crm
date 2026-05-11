import { prisma } from "@/lib/prisma"

export async function calcularIndicadoresComerciais(mes: number, ano: number) {
  const consultas = await prisma.consulta.findMany({
    where: { mesPagamento: mes, anoPagamento: ano, dataPagamento: { not: null }, status: { not: "CANCELADA" } },
    select: { valor: true, valorProcedimento: true, origem: true },
  })

  const novos      = consultas.filter((c) => c.origem !== "RECORRENCIA" && Number(c.valor ?? 0) > 0)
  const recorrente = consultas.filter((c) => c.origem === "RECORRENCIA" || Number(c.valorProcedimento ?? 0) > 0)

  const agendNovosQtd    = novos.length
  const agendNovosValor  = novos.reduce((s, c) => s + Number(c.valor ?? 0), 0)

  const recorrenciaQtd   = recorrente.length
  const recorrenciaValor = recorrente.reduce((s, c) => {
    if (c.origem === "RECORRENCIA") {
      return s + Number(c.valor ?? 0) + Number(c.valorProcedimento ?? 0)
    }
    return s + Number(c.valorProcedimento ?? 0)
  }, 0)

  return {
    agendNovosQtd,
    agendNovosValor,
    agendNovosTicket: agendNovosQtd > 0 ? agendNovosValor / agendNovosQtd : 0,
    recorrenciaQtd,
    recorrenciaValor,
    recorrenciaTicket: recorrenciaQtd > 0 ? recorrenciaValor / recorrenciaQtd : 0,
  }
}
