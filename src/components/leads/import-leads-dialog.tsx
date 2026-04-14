"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { importLeadsAction, type LeadImportRow } from "@/actions/leads/import"
import { LeadImportRowSchema } from "@/actions/leads/import"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Upload, Loader2, FileSpreadsheet } from "lucide-react"

type ParsedRow = LeadImportRow & { _error?: string }

const COLUMN_MAP: Record<string, keyof LeadImportRow> = {
  nome: "nome",
  name: "nome",
  canal: "canal",
  channel: "canal",
  whatsapp: "codigoWhatsApp",
  "codigo whatsapp": "codigoWhatsApp",
  "código whatsapp": "codigoWhatsApp",
  whats: "codigoWhatsApp",
  status: "status",
  observacoes: "observacoes",
  "observações": "observacoes",
  obs: "observacoes",
}

function normalizeHeader(header: string): keyof LeadImportRow | null {
  const key = header.toLowerCase().trim()
  return COLUMN_MAP[key] ?? null
}

function parseRows(raw: Record<string, unknown>[]): ParsedRow[] {
  return raw.map((row) => {
    const mapped: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(row)) {
      const field = normalizeHeader(key)
      if (field) mapped[field] = String(value ?? "").trim()
    }

    // Normalize enum values
    if (mapped.canal) {
      mapped.canal = String(mapped.canal).toUpperCase().replace(/\s+/g, "_")
    }
    if (mapped.status) {
      mapped.status = String(mapped.status).toUpperCase().replace(/\s+/g, "_")
    }

    const result = LeadImportRowSchema.safeParse(mapped)
    if (result.success) {
      return result.data as ParsedRow
    }
    return { ...mapped, _error: result.error.issues.map((i) => i.message).join(", ") } as ParsedRow
  })
}

export function ImportLeadsDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = evt.target?.result
      const workbook = XLSX.read(data, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)
      setRows(parseRows(raw))
    }
    reader.readAsArrayBuffer(file)
  }

  const validRows = rows.filter((r) => !r._error)
  const errorRows = rows.filter((r) => r._error)

  async function handleImport() {
    if (validRows.length === 0) return
    setLoading(true)
    const result = await importLeadsAction({ rows: validRows })
    setLoading(false)
    if (result.success) {
      toast.success(`${result.data.count} leads importados com sucesso!`)
      setOpen(false)
      setRows([])
      if (fileRef.current) fileRef.current.value = ""
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Importar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Leads</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* File input */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Selecione um arquivo CSV ou XLSX
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Colunas esperadas: nome, canal, whatsapp, status, observações
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              id="leads-file"
              onChange={handleFile}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              Escolher arquivo
            </Button>
          </div>

          {/* Preview table */}
          {rows.length > 0 && (
            <div className="flex-1 overflow-auto">
              <div className="flex items-center gap-3 mb-2 text-sm">
                <span>{rows.length} linhas lidas</span>
                <Badge variant="default" className="bg-green-600">
                  {validRows.length} válidas
                </Badge>
                {errorRows.length > 0 && (
                  <Badge variant="destructive">{errorRows.length} com erro</Badge>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} className={row._error ? "bg-red-50 dark:bg-red-950/20" : ""}>
                      <TableCell>{row.nome}</TableCell>
                      <TableCell>{row.canal}</TableCell>
                      <TableCell>{row.codigoWhatsApp ?? "—"}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>
                        {row._error ? (
                          <Badge variant="destructive" className="text-xs">
                            {row._error}
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600 text-xs">
                            OK
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={validRows.length === 0 || loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar importação ({validRows.length} leads)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
