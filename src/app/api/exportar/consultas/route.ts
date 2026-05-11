import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import ExcelJS from "exceljs"
import type { StatusConsulta, OrigemConsulta } from "@/lib/enums"
import { Prisma } from "@prisma/client"

const STATUS_LABELS: Record<StatusConsulta, string> = {
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
  PENDENTE: "Pendente",
}

const ORIGEM_LABELS: Record<OrigemConsulta, string> = {
  FC: "FC",
  LINK: "Link",
  TRAFEGO: "Tráfego",
  RECORRENCIA: "Recorrência",
  REMARTIK: "Remartik",
  IMPULSIONAR: "Impulsionar",
}

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
]

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ erro: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const mes = parseInt(searchParams.get("mes") ?? String(new Date().getMonth() + 1))
  const ano = parseInt(searchParams.get("ano") ?? String(new Date().getFullYear()))
  const status = searchParams.get("status") || null
  const origem = searchParams.get("origem") || null

  const where: Prisma.ConsultaWhereInput = {
    mes,
    ano,
    ...(status && status !== "todos" && { status: status as StatusConsulta }),
    ...(origem && origem !== "todos" && { origem: origem as OrigemConsulta }),
  }

  const consultas = await prisma.consulta.findMany({
    where,
    orderBy: { dataConsulta: "desc" },
    include: { lead: { select: { nome: true } } },
  })

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Consultas")

  sheet.columns = [
    { header: "Cliente", key: "nomeCliente", width: 30 },
    { header: "Data Consulta", key: "dataConsulta", width: 15 },
    { header: "Data Pagamento", key: "dataPagamento", width: 15 },
    { header: "Origem", key: "origem", width: 20 },
    { header: "Valor (R$)", key: "valor", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "Lead Origem", key: "lead", width: 25 },
    { header: "Observações", key: "observacoes", width: 40 },
  ]

  // Style header
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE5E7EB" },
  }

  for (const c of consultas) {
    sheet.addRow({
      nomeCliente: c.nomeCliente,
      dataConsulta: c.dataConsulta ? new Date(c.dataConsulta).toLocaleDateString("pt-BR") : "",
      dataPagamento: c.dataPagamento ? new Date(c.dataPagamento).toLocaleDateString("pt-BR") : "",
      origem: ORIGEM_LABELS[c.origem as OrigemConsulta] ?? c.origem,
      valor: c.valor != null ? Number(c.valor) : "",
      status: STATUS_LABELS[c.status as StatusConsulta] ?? c.status,
      lead: c.lead?.nome ?? "",
      observacoes: c.observacoes ?? "",
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `consultas-${MESES[mes - 1]}-${ano}.xlsx`

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
