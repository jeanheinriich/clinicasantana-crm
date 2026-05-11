import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { MetaFinanceiraForm } from "@/components/financeiro/meta-financeira-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { temPermissao } from "@/lib/permissions"
import type { PapelUsuario } from "@/lib/enums"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export default async function MetasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const papel = session.user.papel as PapelUsuario
  if (!temPermissao(papel, "financeiro", "view")) redirect("/dashboard?erro=sem-permissao")

  const podeEditar = temPermissao(papel, "financeiro", "edit")

  const ano = new Date().getFullYear()

  const [metas, realizados] = await Promise.all([
    prisma.metaFinanceira.findMany({
      where: { ano },
      orderBy: { mes: "asc" },
    }),
    prisma.consulta.groupBy({
      by: ["mesPagamento"],
      where: { anoPagamento: ano, dataPagamento: { not: null } },
      _sum: { valor: true, valorProcedimento: true },
    }),
  ])

  function getProgressColor(ratio: number): string {
    if (ratio >= 1.0)  return "hsl(36, 55%, 45%)"
    if (ratio >= 0.87) return "hsl(38, 70%, 52%)"
    if (ratio >= 0.75) return "hsl(40, 85%, 58%)"
    return "hsl(20, 65%, 52%)"
  }

  const dadosMensais = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const meta = metas.find((me) => me.mes === m)
    const r = realizados.find((r) => r.mesPagamento === m)
    const realizado = Number(r?._sum.valor ?? 0) + Number(r?._sum.valorProcedimento ?? 0)
    return { mes: m, nomeMes: MESES[i], meta, realizado }
  })

  const hoje = new Date()
  const mesSelecionado = hoje.getMonth() + 1
  const metaAtualRaw = metas.find((m) => m.mes === mesSelecionado)
  const metaAtual = metaAtualRaw ? {
    id: metaAtualRaw.id,
    mes: metaAtualRaw.mes,
    ano: metaAtualRaw.ano,
    metaAceitavel: Number(metaAtualRaw.metaAceitavel),
    metaIdeal: Number(metaAtualRaw.metaIdeal),
    superMeta: Number(metaAtualRaw.superMeta),
  } : undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Metas Financeiras</h2>
          <p className="text-muted-foreground text-sm">Ano {ano}</p>
        </div>
        {podeEditar && (
          <MetaFinanceiraForm
            mes={mesSelecionado}
            ano={ano}
            metaAtual={metaAtual ?? null}
          />
        )}
      </div>

      {/* Tabela anual */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {dadosMensais.map(({ mes, nomeMes, meta, realizado }) => {
          const percentual = meta && Number(meta.superMeta) > 0
            ? Math.min((realizado / Number(meta.superMeta)) * 100, 100)
            : 0
          const isMesAtual = mes === mesSelecionado

          return (
            <Card
              key={mes}
              className={
                isMesAtual
                  ? "ring-2 ring-[hsl(36,55%,45%)]/40"
                  : !meta
                  ? "border border-dashed"
                  : ""
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  {nomeMes}
                  {isMesAtual && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[hsl(36,45%,92%)] text-[hsl(30,20%,20%)]">
                      Mês atual
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {meta ? (
                  <>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xl font-bold">{formatCurrency(realizado)}</span>
                      <span className="text-sm font-semibold text-[hsl(30,15%,40%)]">{percentual.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentual}%`,
                          backgroundColor: getProgressColor(
                            realizado / Number(meta.metaAceitavel),
                          ),
                        }}
                      />
                    </div>
                    <div className="hidden sm:grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                      <div>
                        <p>Aceitável</p>
                        <p className="font-medium text-foreground">{formatCurrency(Number(meta.metaAceitavel))}</p>
                      </div>
                      <div>
                        <p>Ideal</p>
                        <p className="font-medium text-foreground">{formatCurrency(Number(meta.metaIdeal))}</p>
                      </div>
                      <div>
                        <p>Super</p>
                        <p className="font-medium text-foreground">{formatCurrency(Number(meta.superMeta))}</p>
                      </div>
                    </div>
                    <div className="sm:hidden space-y-0.5 text-xs text-muted-foreground">
                      {[
                        { label: "Aceitável", valor: Number(meta.metaAceitavel) },
                        { label: "Ideal",     valor: Number(meta.metaIdeal) },
                        { label: "Super",     valor: Number(meta.superMeta) },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between">
                          <span>{item.label}</span>
                          <span className="font-medium text-foreground">{formatCurrency(item.valor)}</span>
                        </div>
                      ))}
                    </div>
                    {podeEditar && (
                      <MetaFinanceiraForm mes={mes} ano={ano} metaAtual={{
                        id: meta.id,
                        mes: meta.mes,
                        ano: meta.ano,
                        metaAceitavel: Number(meta.metaAceitavel),
                        metaIdeal: Number(meta.metaIdeal),
                        superMeta: Number(meta.superMeta),
                      }}>
                        <button className="text-xs text-[hsl(36,55%,45%)] hover:underline">
                          Editar meta
                        </button>
                      </MetaFinanceiraForm>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    <p>Sem meta configurada</p>
                    {podeEditar && (
                      <MetaFinanceiraForm mes={mes} ano={ano} metaAtual={null}>
                        <button className="text-xs text-[hsl(36,55%,45%)] font-medium hover:underline mt-1">
                          + Configurar
                        </button>
                      </MetaFinanceiraForm>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
