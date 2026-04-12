import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ConversaoForm } from "@/components/indicadores/conversao-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { temPermissao } from "@/lib/permissions"
import type { PapelUsuario } from "@/lib/enums"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

interface SearchParams { mes?: string; ano?: string }

export default async function IndicadorConversaoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const papel = session.user.papel as PapelUsuario
  if (!temPermissao(papel, "indicadores", "view")) redirect("/dashboard?erro=sem-permissao")

  const podeEditar = temPermissao(papel, "indicadores", "edit")
  const hoje = new Date()
  const params = await searchParams
  const mes = parseInt(params.mes ?? String(hoje.getMonth() + 1))
  const ano = parseInt(params.ano ?? String(hoje.getFullYear()))

  const [indicador, historico] = await Promise.all([
    prisma.indicadorConversao.findUnique({ where: { mes_ano: { mes, ano } } }),
    prisma.indicadorConversao.findMany({
      where: { ano },
      orderBy: { mes: "asc" },
    }),
  ])

  const taxaConversao = indicador && indicador.totalLeads > 0
    ? ((indicador.consultasRealizadas / indicador.totalLeads) * 100).toFixed(1)
    : "0.0"

  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - 2 + i)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Indicadores de Conversão</h2>
          <p className="text-muted-foreground text-sm">{MESES[mes - 1]} / {ano}</p>
        </div>
        <form method="GET" className="flex gap-2">
          <Select name="mes" defaultValue={String(mes)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select name="ano" defaultValue={String(ano)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anosDisponiveis.map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" variant="outline" size="sm">Ver</Button>
        </form>
      </div>

      {/* Taxa de conversão destaque */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Taxa de Conversão — {MESES[mes - 1]}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-6">
          <div>
            <p
              className="text-5xl font-bold"
              style={{ color: parseFloat(taxaConversao) >= 10 ? "hsl(36, 55%, 45%)" : "hsl(20, 65%, 52%)" }}
            >
              {taxaConversao}%
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {indicador?.consultasRealizadas ?? 0} realizadas / {indicador?.totalLeads ?? 0} leads
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm pb-1">
            <div>
              <p className="text-muted-foreground">Tráfego</p>
              <p className="font-semibold">{indicador?.leadsTrafego ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Impulsionar</p>
              <p className="font-semibold">{indicador?.leadsImpulsionar ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Remartik</p>
              <p className="font-semibold">{indicador?.leadsRemartik ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">FC</p>
              <p className="font-semibold">{indicador?.leadsFC ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Link</p>
              <p className="font-semibold">{indicador?.leadsLink ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fáb. Instagram</p>
              <p className="font-semibold">{indicador?.leadsFabrica ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Turbinar</p>
              <p className="font-semibold">{indicador?.leadsTurbinar ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards por canal com borda superior colorida */}
      {indicador && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Tráfego",      valor: indicador.leadsTrafego,     cor: "border-t-amber-400"  },
            { label: "Impulsionar",  valor: indicador.leadsImpulsionar, cor: "border-t-blue-400"   },
            { label: "Remartik",     valor: indicador.leadsRemartik,    cor: "border-t-purple-400" },
            { label: "FC",           valor: indicador.leadsFC,          cor: "border-t-green-400"  },
            { label: "Link",         valor: indicador.leadsLink,        cor: "border-t-orange-400" },
          ].map((canal) => (
            <Card key={canal.label} className={`border-t-4 ${canal.cor}`}>
              <CardContent className="pt-4 px-4 pb-4">
                <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">{canal.label}</p>
                <p className="text-2xl font-bold mt-1">{canal.valor}</p>
                <p className="text-xs text-muted-foreground mt-0.5">leads</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Histórico anual resumido */}
      {historico.length > 0 && (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Mês</th>
                <th className="text-right p-3 font-medium">Total Leads</th>
                <th className="text-right p-3 font-medium">Realizadas</th>
                <th className="text-right p-3 font-medium">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((h) => (
                <tr key={h.id} className={`border-b ${h.mes === mes ? "bg-muted/60 font-medium" : ""}`}>
                  <td className="p-3">{MESES[h.mes - 1]}</td>
                  <td className="p-3 text-right">{h.totalLeads}</td>
                  <td className="p-3 text-right">{h.consultasRealizadas}</td>
                  <td className="p-3 text-right font-semibold" style={{
                    color: h.totalLeads > 0 && (h.consultasRealizadas / h.totalLeads) >= 0.1
                      ? "hsl(36, 55%, 45%)"
                      : "hsl(20, 65%, 52%)",
                  }}>
                    {h.totalLeads > 0
                      ? ((h.consultasRealizadas / h.totalLeads) * 100).toFixed(1)
                      : "0.0"}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {podeEditar && (
        <ConversaoForm mes={mes} ano={ano} indicador={indicador ?? null} />
      )}
    </div>
  )
}
