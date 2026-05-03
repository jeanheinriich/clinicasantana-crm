import { prisma } from "@/lib/prisma"

export async function calcularCPLPorCanal(mes: number, ano: number) {
  const inicio = new Date(ano, mes - 1, 1)
  const fim    = new Date(ano, mes,     1)

  const [leadsPorCanal, campanhas] = await Promise.all([
    prisma.lead.groupBy({
      by: ["canal"],
      where: { dataCriacao: { gte: inicio, lt: fim } },
      _count: { canal: true },
    }),
    prisma.metaCampanha.findMany({
      where: {
        OR: [
          { dataInicio: { gte: inicio, lt: fim } },
          { dataFim:    { gte: inicio, lt: fim } },
        ],
      },
      select: { investimento: true },
    }),
  ])

  const investimentoTotal = campanhas.reduce(
    (acc, c) => acc + Number(c.investimento ?? 0),
    0
  )
  const totalLeads = leadsPorCanal.reduce(
    (acc, l) => acc + l._count.canal,
    0
  )
  const cplGeral = investimentoTotal > 0 && totalLeads > 0
    ? investimentoTotal / totalLeads
    : null

  return {
    investimentoTotal,
    totalLeads,
    cplGeral,
    leadsPorCanal: leadsPorCanal.map((l) => ({
      canal:      l.canal,
      quantidade: l._count.canal,
    })),
  }
}
