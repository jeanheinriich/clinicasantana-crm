"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { importConsultasAction } from "@/actions/consultas/import"
import { ConsultaImportRowSchema } from "@/actions/consultas/import/schema"
import type { ConsultaImportRow } from "@/actions/consultas/import/schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Upload, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

type ParsedRow = Partial<ConsultaImportRow> & { _raw?: Record<string, unknown>; _error?: string }

const COLUMN_MAP: Record<string, keyof ConsultaImportRow> = {
  "nome cliente": "nomeCliente",
  "nomecliente": "nomeCliente",
  cliente: "nomeCliente",
  "nome do cliente": "nomeCliente",
  "data consulta": "dataConsulta",
  "dataconsulta": "dataConsulta",
  "data": "dataConsulta",
  "data pagamento": "dataPagamento",
  "datapagamento": "dataPagamento",
  "pgto": "dataPagamento",
  origem: "origem",
  canal: "origem",
  valor: "valor",
  "valor (r$)": "valor",
  "r$": "valor",
  status: "status",
  situacao: "status",
  "situação": "status",
}

function normalizeHeader(h: string): keyof ConsultaImportRow | null {
  return COLUMN_MAP[h.toLowerCase().trim()] ?? null
}

function parseDate(value: unknown): string {
  if (!value) return ""
  if (typeof value === "number") {
    // Excel serial date
    const d = new Date(Math.round((value - 25569) * 86400 * 1000))
    return d.toISOString().split("T")[0]
  }
  const s = String(value).trim()
  // DD/MM/YYYY → YYYY-MM-DD
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`
  return s
}

function parseRows(raw: Record<string, unknown>[]): ParsedRow[] {
  return raw.map((row) => {
    const mapped: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(row)) {
      const field = normalizeHeader(key)
      if (field) {
        if (field === "dataConsulta" || field === "dataPagamento") {
          mapped[field] = parseDate(value)
        } else {
          mapped[field] = String(value ?? "").trim()
        }
      }
    }

    // Normaliza enums
    if (mapped.origem) {
      mapped.origem = String(mapped.origem)
        .normalize("NFD").replace(/[̀-ͯ]/g, "") // remove acentos
        .toUpperCase().replace(/\s+/g, "_")
    }
    if (mapped.status) {
      const s = String(mapped.status).toUpperCase()
      if (s.includes("REALIZ")) mapped.status = "REALIZADA"
      else if (s.includes("CANCEL")) mapped.status = "CANCELADA"
      else mapped.status = "PENDENTE"
    }

    const result = ConsultaImportRowSchema.safeParse(mapped)
    if (result.success) {
      return result.data as ParsedRow
    }
    return { ...mapped, _error: result.error.issues.map((i) => i.message).join(", ") } as ParsedRow
  })
}

export function ImportConsultasDialog({ inline = false }: { inline?: boolean }) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = evt.target?.result
      const wb = XLSX.read(data, { type: "array" })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)
      setRows(parseRows(raw))
    }
    reader.readAsArrayBuffer(file)
  }

  const validRows = rows.filter((r) => !r._error) as ConsultaImportRow[]
  const errorRows = rows.filter((r) => r._error)

  async function handleImport() {
    if (validRows.length === 0) return
    setLoading(true)
    const result = await importConsultasAction({ rows: validRows })
    setLoading(false)
    if (result.success) {
      toast.success(`${result.data.count} consultas importadas com sucesso!`)
      setRows([])
      if (fileRef.current) fileRef.current.value = ""
    } else {
      toast.error(result.error)
    }
  }

  const content = (
    <div className="space-y-4">
      {/* File upload */}
      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-1">
          Selecione um arquivo CSV ou XLSX com os dados históricos
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Colunas esperadas: nome cliente, data consulta, data pagamento, origem, valor, status
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          id="consultas-file"
          onChange={handleFile}
        />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          Escolher arquivo
        </Button>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <span>{rows.length} linhas lidas</span>
            <Badge className="bg-green-600">{validRows.length} válidas</Badge>
            {errorRows.length > 0 && (
              <Badge variant="destructive">{errorRows.length} com erro</Badge>
            )}
          </div>

          <div className="overflow-auto max-h-96 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data Consulta</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow
                    key={i}
                    className={row._error ? "bg-red-50 dark:bg-red-950/20" : ""}
                  >
                    <TableCell>{String(row.nomeCliente ?? "—")}</TableCell>
                    <TableCell>
                      {row.dataConsulta instanceof Date
                        ? row.dataConsulta.toLocaleDateString("pt-BR")
                        : String(row.dataConsulta ?? "—")}
                    </TableCell>
                    <TableCell>{String(row.origem ?? "—")}</TableCell>
                    <TableCell>
                      {row.valor != null ? formatCurrency(Number(row.valor)) : "—"}
                    </TableCell>
                    <TableCell>{String(row.status ?? "—")}</TableCell>
                    <TableCell>
                      {row._error ? (
                        <Badge variant="destructive" className="text-xs">{row._error}</Badge>
                      ) : (
                        <Badge className="bg-green-600 text-xs">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleImport} disabled={validRows.length === 0 || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar importação ({validRows.length} consultas)
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  return content
}
