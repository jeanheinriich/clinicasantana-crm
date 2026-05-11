import { prisma } from "@/lib/prisma"

export async function calcularIndicadoresComerciais(mes: number, ano: number) {
  const consultas = await prisma.consulta.findMany({
    where: { mesPagamento: mes, anoPagamento: ano, dataPagamento: { not: null } },
    select: { valor: true, valorProcedimento: true },
  })

  const agendNovos   = consultas.filter((c) => Number(c.valor ?? 0) > 0)
  const recorrencia  = consultas.filter((c) => Number(c.valorProcedimento ?? 0) > 0)

  const agendNovosQtd    = agendNovos.length
  const agendNovosValor  = agendNovos.reduce((s, c) => s + Number(c.valor ?? 0), 0)
  const recorrenciaQtd   = recorrencia.length
  const recorrenciaValor = recorrencia.reduce((s, c) => s + Number(c.valorProcedimento ?? 0), 0)

  return {
    agendNovosQtd,
    agendNovosValor,
    agendNovosTicket: agendNovosQtd > 0 ? agendNovosValor / agendNovosQtd : 0,
    recorrenciaQtd,
    recorrenciaValor,
    recorrenciaTicket: recorrenciaQtd > 0 ? recorrenciaValor / recorrenciaQtd : 0,
  }
}
