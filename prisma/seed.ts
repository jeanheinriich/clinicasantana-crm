import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed com dados de demonstração...")

  // ─── Usuários ────────────────────────────────────────────────────────────────
  const senhaHash = await bcrypt.hash("admin123", 10)

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@clinicasantana.com.br" },
    update: {},
    create: { nome: "Ana Lima", email: "admin@clinicasantana.com.br", senha: senhaHash, papel: "ADMIN" },
  })

  const gestor = await prisma.usuario.upsert({
    where: { email: "gestor@clinicasantana.com.br" },
    update: {},
    create: { nome: "Carla Mendes", email: "gestor@clinicasantana.com.br", senha: senhaHash, papel: "GESTOR" },
  })

  const atendente1 = await prisma.usuario.upsert({
    where: { email: "atendente1@clinicasantana.com.br" },
    update: {},
    create: { nome: "Fernanda Costa", email: "atendente1@clinicasantana.com.br", senha: senhaHash, papel: "ATENDENTE" },
  })

  const atendente2 = await prisma.usuario.upsert({
    where: { email: "atendente2@clinicasantana.com.br" },
    update: {},
    create: { nome: "Juliana Rocha", email: "atendente2@clinicasantana.com.br", senha: senhaHash, papel: "ATENDENTE" },
  })

  console.log("✅ Usuários criados")

  // ─── Campanhas Meta Ads ──────────────────────────────────────────────────────
  const camp1 = await prisma.metaCampanha.upsert({
    where: { campanhaId: "camp_001" },
    update: {},
    create: {
      campanhaId: "camp_001",
      nome: "Botox Abril 2026",
      status: "ACTIVE",
      investimento: 1200,
      alcance: 18400,
      impressoes: 52000,
      cliques: 940,
      leadsGerados: 47,
      custoPorLead: 25.53,
      dataInicio: new Date("2026-04-01"),
    },
  })

  const camp2 = await prisma.metaCampanha.upsert({
    where: { campanhaId: "camp_002" },
    update: {},
    create: {
      campanhaId: "camp_002",
      nome: "Preenchimento Labial",
      status: "ACTIVE",
      investimento: 800,
      alcance: 11200,
      impressoes: 31000,
      cliques: 620,
      leadsGerados: 28,
      custoPorLead: 28.57,
      dataInicio: new Date("2026-04-01"),
    },
  })

  const camp3 = await prisma.metaCampanha.upsert({
    where: { campanhaId: "camp_003" },
    update: {},
    create: {
      campanhaId: "camp_003",
      nome: "Harmonização Facial Mar",
      status: "PAUSED",
      investimento: 1500,
      alcance: 22000,
      impressoes: 68000,
      cliques: 1100,
      leadsGerados: 63,
      custoPorLead: 23.81,
      dataInicio: new Date("2026-03-01"),
      dataFim: new Date("2026-03-31"),
    },
  })

  console.log("✅ Campanhas criadas")

  // ─── Leads ───────────────────────────────────────────────────────────────────
  const agora = new Date()
  const mes = agora.getMonth() + 1
  const ano = agora.getFullYear()

  const leadsData = [
    // Abril 2026 — mês atual
    { nome: "Mariana Oliveira", canal: "TRAFEGO", status: "AGENDADO", userId: atendente1.id, origemCampanhaId: camp1.id, dataCriacao: new Date("2026-04-03T09:15:00") },
    { nome: "Beatriz Santos", canal: "TRAFEGO", status: "ABORDAGEM", userId: atendente1.id, origemCampanhaId: camp1.id, dataCriacao: new Date("2026-04-03T11:00:00") },
    { nome: "Gabriela Lima", canal: "IMPULSIONAR", status: "AGENDADO", userId: atendente1.id, origemCampanhaId: camp2.id, dataCriacao: new Date("2026-04-02T14:30:00") },
    { nome: "Isabela Ferreira", canal: "IMPULSIONAR", status: "CONVERTIDO", userId: atendente2.id, origemCampanhaId: camp2.id, dataCriacao: new Date("2026-04-01T10:00:00") },
    { nome: "Letícia Alves", canal: "REMARTIK", status: "ABORDAGEM", userId: atendente2.id, dataCriacao: new Date("2026-04-04T08:45:00") },
    { nome: "Amanda Souza", canal: "REMARTIK", status: "PAROU_DE_INTERAGIR", userId: atendente2.id, dataCriacao: new Date("2026-04-02T16:00:00") },
    { nome: "Camila Pereira", canal: "FC", status: "AGENDADO", userId: admin.id, dataCriacao: new Date("2026-04-04T09:30:00") },
    { nome: "Natalia Costa", canal: "FC", status: "CONVERTIDO", userId: admin.id, dataCriacao: new Date("2026-04-01T13:00:00") },
    { nome: "Renata Melo", canal: "LINK", status: "ABORDAGEM", userId: atendente1.id, dataCriacao: new Date("2026-04-03T15:45:00") },
    { nome: "Patrícia Gomes", canal: "TRAFEGO", status: "CANCELADO", userId: atendente2.id, origemCampanhaId: camp1.id, dataCriacao: new Date("2026-04-01T11:30:00") },
    { nome: "Vanessa Ribeiro", canal: "IMPULSIONAR", status: "ABORDAGEM", userId: atendente1.id, origemCampanhaId: camp2.id, dataCriacao: new Date("2026-04-04T10:15:00") },
    { nome: "Larissa Nunes", canal: "TRAFEGO", status: "AGENDADO", userId: atendente1.id, origemCampanhaId: camp1.id, dataCriacao: new Date("2026-04-03T14:00:00") },
    // Março 2026
    { nome: "Paula Carvalho", canal: "TRAFEGO", status: "CONVERTIDO", userId: atendente1.id, origemCampanhaId: camp3.id, dataCriacao: new Date("2026-03-05T09:00:00") },
    { nome: "Tatiana Barbosa", canal: "IMPULSIONAR", status: "CONVERTIDO", userId: atendente2.id, dataCriacao: new Date("2026-03-08T10:30:00") },
    { nome: "Sandra Torres", canal: "REMARTIK", status: "CONVERTIDO", userId: admin.id, dataCriacao: new Date("2026-03-12T11:00:00") },
    { nome: "Mônica Dias", canal: "FC", status: "PAROU_DE_INTERAGIR", userId: atendente1.id, dataCriacao: new Date("2026-03-15T09:45:00") },
    { nome: "Roberta Pinto", canal: "LINK", status: "CONVERTIDO", userId: atendente2.id, dataCriacao: new Date("2026-03-18T14:00:00") },
    { nome: "Cristiane Sousa", canal: "TRAFEGO", status: "ABORDAGEM", userId: atendente1.id, origemCampanhaId: camp3.id, dataCriacao: new Date("2026-03-22T10:00:00") },
    // Fevereiro 2026
    { nome: "Claudia Moreira", canal: "TRAFEGO", status: "CONVERTIDO", userId: atendente2.id, dataCriacao: new Date("2026-02-03T09:00:00") },
    { nome: "Simone Araújo", canal: "FC", status: "CONVERTIDO", userId: admin.id, dataCriacao: new Date("2026-02-10T11:00:00") },
    { nome: "Eliane Martins", canal: "REMARTIK", status: "CONVERTIDO", userId: atendente1.id, dataCriacao: new Date("2026-02-14T13:30:00") },
    { nome: "Denise Correia", canal: "IMPULSIONAR", status: "CANCELADO", userId: atendente2.id, dataCriacao: new Date("2026-02-18T09:00:00") },
  ]

  const leads: { id: string; nome: string }[] = []
  for (const data of leadsData) {
    const lead = await prisma.lead.create({
      data: {
        ...data,
        dataUltimaInteracao: data.dataCriacao,
      },
    })
    leads.push({ id: lead.id, nome: lead.nome })
  }

  // Interações em alguns leads
  await prisma.leadInteracao.createMany({
    data: [
      { leadId: leads[0].id, descricao: "Lead entrou em contato via WhatsApp. Interesse em botox.", criadoEm: new Date("2026-04-03T09:20:00") },
      { leadId: leads[0].id, descricao: "Agendamento confirmado para 08/04 às 14h.", criadoEm: new Date("2026-04-03T10:00:00") },
      { leadId: leads[2].id, descricao: "Perguntou sobre preenchimento labial e harmonização.", criadoEm: new Date("2026-04-02T14:35:00") },
      { leadId: leads[2].id, descricao: "Enviou fotos de referência. Consulta marcada.", criadoEm: new Date("2026-04-02T15:00:00") },
      { leadId: leads[3].id, descricao: "Veio à clínica. Realizou procedimento.", criadoEm: new Date("2026-04-01T10:05:00") },
      { leadId: leads[6].id, descricao: "Indicação da amiga Natalia. Agendou para próxima semana.", criadoEm: new Date("2026-04-04T09:35:00") },
    ],
  })

  console.log(`✅ ${leads.length} leads criados com interações`)

  // ─── Consultas ───────────────────────────────────────────────────────────────
  const consultasData = [
    // Abril 2026 — mês atual
    { nomeCliente: "Isabela Ferreira", dataConsulta: new Date("2026-04-01"), dataPagamento: new Date("2026-04-01"), origem: "TRAFEGO", valor: 450, status: "REALIZADA", mes: 4, ano: 2026, leadId: leads[3].id },
    { nomeCliente: "Natalia Costa", dataConsulta: new Date("2026-04-01"), dataPagamento: new Date("2026-04-01"), origem: "FC", valor: 380, status: "REALIZADA", mes: 4, ano: 2026, leadId: leads[7].id },
    { nomeCliente: "Elaine Rodrigues", dataConsulta: new Date("2026-04-02"), dataPagamento: new Date("2026-04-02"), origem: "LINK", valor: 520, status: "REALIZADA", mes: 4, ano: 2026 },
    { nomeCliente: "Fernanda Lima", dataConsulta: new Date("2026-04-02"), dataPagamento: new Date("2026-04-02"), origem: "TRAFEGO", valor: 890, status: "REALIZADA", mes: 4, ano: 2026 },
    { nomeCliente: "Mariana Oliveira", dataConsulta: new Date("2026-04-08"), origem: "TRAFEGO", valor: 650, status: "PENDENTE", mes: 4, ano: 2026, leadId: leads[0].id },
    { nomeCliente: "Gabriela Lima", dataConsulta: new Date("2026-04-08"), origem: "IMPULSIONAR", valor: 480, status: "PENDENTE", mes: 4, ano: 2026, leadId: leads[2].id },
    { nomeCliente: "Camila Pereira", dataConsulta: new Date("2026-04-10"), origem: "FC", valor: 750, status: "PENDENTE", mes: 4, ano: 2026, leadId: leads[6].id },
    { nomeCliente: "Larissa Nunes", dataConsulta: new Date("2026-04-10"), origem: "TRAFEGO", valor: 420, status: "PENDENTE", mes: 4, ano: 2026, leadId: leads[11].id },
    { nomeCliente: "Beatriz Andrade", dataConsulta: new Date("2026-04-03"), origem: "REMARTIK", valor: 0, status: "CANCELADA", mes: 4, ano: 2026 },
    // Março 2026
    { nomeCliente: "Paula Carvalho", dataConsulta: new Date("2026-03-10"), dataPagamento: new Date("2026-03-10"), origem: "TRAFEGO", valor: 680, status: "REALIZADA", mes: 3, ano: 2026, leadId: leads[12].id },
    { nomeCliente: "Tatiana Barbosa", dataConsulta: new Date("2026-03-12"), dataPagamento: new Date("2026-03-12"), origem: "IMPULSIONAR", valor: 950, status: "REALIZADA", mes: 3, ano: 2026, leadId: leads[13].id },
    { nomeCliente: "Sandra Torres", dataConsulta: new Date("2026-03-15"), dataPagamento: new Date("2026-03-15"), origem: "REMARTIK", valor: 520, status: "REALIZADA", mes: 3, ano: 2026, leadId: leads[14].id },
    { nomeCliente: "Roberta Pinto", dataConsulta: new Date("2026-03-20"), dataPagamento: new Date("2026-03-20"), origem: "LINK", valor: 780, status: "REALIZADA", mes: 3, ano: 2026, leadId: leads[16].id },
    { nomeCliente: "Andreia Campos", dataConsulta: new Date("2026-03-22"), dataPagamento: new Date("2026-03-22"), origem: "FC", valor: 450, status: "REALIZADA", mes: 3, ano: 2026 },
    { nomeCliente: "Luciana Freitas", dataConsulta: new Date("2026-03-24"), dataPagamento: new Date("2026-03-24"), origem: "TRAFEGO", valor: 620, status: "REALIZADA", mes: 3, ano: 2026 },
    { nomeCliente: "Priscila Nascimento", dataConsulta: new Date("2026-03-26"), dataPagamento: new Date("2026-03-26"), origem: "TRAFEGO_RECORRENCIA", valor: 380, status: "REALIZADA", mes: 3, ano: 2026 },
    { nomeCliente: "Juliana Silva", dataConsulta: new Date("2026-03-28"), dataPagamento: new Date("2026-03-28"), origem: "REMARTIK", valor: 850, status: "REALIZADA", mes: 3, ano: 2026 },
    { nomeCliente: "Viviane Santos", dataConsulta: new Date("2026-03-29"), origem: "FC", valor: 0, status: "CANCELADA", mes: 3, ano: 2026 },
    // Fevereiro 2026
    { nomeCliente: "Claudia Moreira", dataConsulta: new Date("2026-02-05"), dataPagamento: new Date("2026-02-05"), origem: "TRAFEGO", valor: 490, status: "REALIZADA", mes: 2, ano: 2026, leadId: leads[18].id },
    { nomeCliente: "Simone Araújo", dataConsulta: new Date("2026-02-12"), dataPagamento: new Date("2026-02-12"), origem: "FC", valor: 720, status: "REALIZADA", mes: 2, ano: 2026, leadId: leads[19].id },
    { nomeCliente: "Eliane Martins", dataConsulta: new Date("2026-02-16"), dataPagamento: new Date("2026-02-16"), origem: "REMARTIK", valor: 560, status: "REALIZADA", mes: 2, ano: 2026, leadId: leads[20].id },
    { nomeCliente: "Carla Souza", dataConsulta: new Date("2026-02-19"), dataPagamento: new Date("2026-02-19"), origem: "TRAFEGO_RECORRENCIA", valor: 380, status: "REALIZADA", mes: 2, ano: 2026 },
    { nomeCliente: "Regina Fonseca", dataConsulta: new Date("2026-02-22"), dataPagamento: new Date("2026-02-22"), origem: "LINK", valor: 650, status: "REALIZADA", mes: 2, ano: 2026 },
    { nomeCliente: "Adriana Lopes", dataConsulta: new Date("2026-02-25"), dataPagamento: new Date("2026-02-25"), origem: "TRAFEGO", valor: 430, status: "REALIZADA", mes: 2, ano: 2026 },
    // Janeiro 2026
    { nomeCliente: "Magda Pereira", dataConsulta: new Date("2026-01-08"), dataPagamento: new Date("2026-01-08"), origem: "FC", valor: 480, status: "REALIZADA", mes: 1, ano: 2026 },
    { nomeCliente: "Solange Teixeira", dataConsulta: new Date("2026-01-14"), dataPagamento: new Date("2026-01-14"), origem: "TRAFEGO", valor: 620, status: "REALIZADA", mes: 1, ano: 2026 },
    { nomeCliente: "Ivone Marques", dataConsulta: new Date("2026-01-20"), dataPagamento: new Date("2026-01-20"), origem: "REMARTIK", valor: 540, status: "REALIZADA", mes: 1, ano: 2026 },
    { nomeCliente: "Nilza Cruz", dataConsulta: new Date("2026-01-24"), dataPagamento: new Date("2026-01-24"), origem: "TRAFEGO_RECORRENCIA", valor: 380, status: "REALIZADA", mes: 1, ano: 2026 },
    { nomeCliente: "Edna Ramos", dataConsulta: new Date("2026-01-28"), dataPagamento: new Date("2026-01-28"), origem: "LINK", valor: 750, status: "REALIZADA", mes: 1, ano: 2026 },
  ]

  for (const data of consultasData) {
    await prisma.consulta.create({ data })
  }

  console.log(`✅ ${consultasData.length} consultas criadas`)

  // ─── Metas Financeiras ───────────────────────────────────────────────────────
  const metas = [
    { mes: 1, ano: 2026, metaAceitavel: 12000, metaIdeal: 16000, superMeta: 20000 },
    { mes: 2, ano: 2026, metaAceitavel: 13000, metaIdeal: 17000, superMeta: 22000 },
    { mes: 3, ano: 2026, metaAceitavel: 15000, metaIdeal: 20000, superMeta: 25000 },
    { mes: 4, ano: 2026, metaAceitavel: 15000, metaIdeal: 20000, superMeta: 25000 },
  ]

  for (const meta of metas) {
    await prisma.metaFinanceira.upsert({
      where: { mes_ano: { mes: meta.mes, ano: meta.ano } },
      update: {},
      create: meta,
    })
  }

  console.log("✅ Metas financeiras criadas")

  // ─── Indicadores Comerciais ──────────────────────────────────────────────────
  const indicadoresComerciais = [
    { mes: 1, ano: 2026, agendamentosNovosQtd: 8,  agendamentosNovosValor: 2770, recorrenciaQtd: 5, recorrenciaValor: 1810 },
    { mes: 2, ano: 2026, agendamentosNovosQtd: 10, agendamentosNovosValor: 3230, recorrenciaQtd: 7, recorrenciaValor: 2990 },
    { mes: 3, ano: 2026, agendamentosNovosQtd: 14, agendamentosNovosValor: 5230, recorrenciaQtd: 9, recorrenciaValor: 3800 },
    { mes: 4, ano: 2026, agendamentosNovosQtd: 7,  agendamentosNovosValor: 2570, recorrenciaQtd: 4, recorrenciaValor: 1450 },
  ]

  for (const ic of indicadoresComerciais) {
    await prisma.indicadorComercial.upsert({
      where: { mes_ano: { mes: ic.mes, ano: ic.ano } },
      update: {},
      create: ic,
    })
  }

  console.log("✅ Indicadores comerciais criados")

  // ─── Indicadores de Conversão ────────────────────────────────────────────────
  const indicadoresConversao = [
    { mes: 1, ano: 2026, totalLeads: 38, leadsTrafego: 16, leadsImpulsionar: 8, leadsRemartik: 6, leadsFC: 8, consultasAgendadas: 13, consultasRealizadas: 5 },
    { mes: 2, ano: 2026, totalLeads: 44, leadsTrafego: 18, leadsImpulsionar: 10, leadsRemartik: 7, leadsFC: 9, consultasAgendadas: 16, consultasRealizadas: 6 },
    { mes: 3, ano: 2026, totalLeads: 58, leadsTrafego: 22, leadsImpulsionar: 14, leadsRemartik: 9, leadsFC: 13, consultasAgendadas: 21, consultasRealizadas: 8 },
    { mes: 4, ano: 2026, totalLeads: 12, leadsTrafego: 5,  leadsImpulsionar: 3,  leadsRemartik: 2,  leadsFC: 2,  consultasAgendadas: 8,  consultasRealizadas: 4 },
  ]

  for (const ic of indicadoresConversao) {
    await prisma.indicadorConversao.upsert({
      where: { mes_ano: { mes: ic.mes, ano: ic.ano } },
      update: {},
      create: ic,
    })
  }

  console.log("✅ Indicadores de conversão criados")

  console.log("\n📋 Credenciais de acesso:")
  console.log("   Admin:      admin@clinicasantana.com.br    / admin123")
  console.log("   Gestor:     gestor@clinicasantana.com.br   / admin123")
  console.log("   Atendente:  atendente1@clinicasantana.com.br / admin123")
  console.log("\n🚀 Rode: npm run dev  →  http://localhost:3000/login")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
