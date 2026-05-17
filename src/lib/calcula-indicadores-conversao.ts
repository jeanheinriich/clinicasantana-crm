import { prisma } from "@/lib/prisma"

export async function calcularIndicadoresConversao(mes: number, ano: number) {
  const [leadsPorCanal, consultas] = await Promise.all([
    prisma.lead.groupBy({
      by: ["canal"],
      where: {
        dataCriacao: {
          gte: new Date(ano, mes - 1, 1),
          lt:  new Date(ano, mes,     1),
        },
      },
      _count: { canal: true },
    }),
    prisma.consulta.findMany({
      where: { mes, ano },
      select: { status: true, origem: true, dataPagamento: true },
    }),
  ])

  const porCanal = Object.fromEntries(
    leadsPorCanal.map((l) => [l.canal, l._count.canal])
  )
  const totalLeads           = leadsPorCanal.reduce((acc, l) => acc + l._count.canal, 0)
  const naoCancel            = consultas.filter((c) => c.status !== "CANCELADA")
  const consultasAgendadas   = naoCancel.length
  const consultasRealizadas  = naoCancel.filter((c) => c.status === "REALIZADA").length
  const agendadasNovas       = naoCancel.filter((c) => c.origem !== "RECORRENCIA").length
  const agendadasRecorrencia = naoCancel.filter((c) => c.origem === "RECORRENCIA").length
  const pendentes            = consultasAgendadas - consultasRealizadas

  return {
    totalLeads,
    leadsTrafego:     porCanal["TRAFEGO"]          ?? 0,
    leadsImpulsionar: porCanal["IMPULSIONAR"]       ?? 0,
    leadsRemartik:    porCanal["REMARTIK"]          ?? 0,
    leadsFC:          porCanal["FC"]                ?? 0,
    leadsLink:        porCanal["LINK"]              ?? 0,
    leadsFabrica:     porCanal["FABRICA_INSTAGRAM"] ?? 0,
    leadsTurbinar:    porCanal["TURBINAR"]          ?? 0,
    consultasAgendadas,
    consultasRealizadas,
    agendadasNovas,
    agendadasRecorrencia,
    pendentes,
  }
}

export async function calcularHistoricoConversao(ano: number) {
  const [leads, consultas] = await Promise.all([
    prisma.lead.findMany({
      where: {
        dataCriacao: {
          gte: new Date(ano,     0, 1),
          lt:  new Date(ano + 1, 0, 1),
        },
      },
      select: { dataCriacao: true },
    }),
    prisma.consulta.findMany({
      where: { ano },
      select: { mes: true, status: true, dataPagamento: true },
    }),
  ])

  return Array.from({ length: 12 }, (_, i) => {
    const mes          = i + 1
    const mesLeads     = leads.filter((l) => l.dataCriacao.getMonth() + 1 === mes)
    const mesConsultas = consultas.filter((c) => c.mes === mes && c.status !== "CANCELADA")
    if (mesLeads.length === 0 && mesConsultas.length === 0) return null
    return {
      mes,
      totalLeads:          mesLeads.length,
      consultasRealizadas: mesConsultas.filter((c) => c.status === "REALIZADA").length,
    }
  }).filter((v): v is NonNullable<typeof v> => v !== null)
}
