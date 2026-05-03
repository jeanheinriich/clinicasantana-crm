import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationNavProps {
  pagina: number
  totalPages: number
  buildHref: (page: number) => string
}

export function PaginationNav({ pagina, totalPages, buildHref }: PaginationNavProps) {
  if (totalPages <= 1) return null

  const pages: (number | "...")[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (pagina > 3) pages.push("...")
    for (let i = Math.max(2, pagina - 1); i <= Math.min(totalPages - 1, pagina + 1); i++) {
      pages.push(i)
    }
    if (pagina < totalPages - 2) pages.push("...")
    pages.push(totalPages)
  }

  const itemClass = "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors"

  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      {pagina > 1 ? (
        <Link href={buildHref(pagina - 1)} className={cn(itemClass, "border border-border hover:bg-accent")}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(itemClass, "text-muted-foreground/40 cursor-not-allowed")}>
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className={cn(itemClass, "text-muted-foreground cursor-default")}>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            className={cn(
              itemClass,
              p === pagina
                ? "bg-[hsl(36,45%,92%)] border border-[hsl(36,55%,45%)] text-[hsl(30,20%,15%)] font-medium"
                : "border border-border hover:bg-accent text-foreground"
            )}
          >
            {p}
          </Link>
        )
      )}

      {pagina < totalPages ? (
        <Link href={buildHref(pagina + 1)} className={cn(itemClass, "border border-border hover:bg-accent")}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(itemClass, "text-muted-foreground/40 cursor-not-allowed")}>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </div>
  )
}
