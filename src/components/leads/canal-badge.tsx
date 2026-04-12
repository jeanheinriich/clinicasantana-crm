import type { CanalLead } from "@/lib/enums"

const CANAL_LABELS: Record<CanalLead, string> = {
  IMPULSIONAR:       "Impulsionar",
  REMARTIK:          "Remartik",
  TRAFEGO:           "Tráfego",
  FC:                "FC",
  LINK:              "Link",
  FABRICA_INSTAGRAM: "Fáb. Instagram",
  TURBINAR:          "Turbinar",
  OUTRO:             "Outro",
}

const CANAL_COLORS: Record<CanalLead, { bg: string; color: string; border: string }> = {
  IMPULSIONAR:       { bg: "hsl(210 65% 95%)", color: "hsl(210 65% 32%)", border: "hsl(210 65% 78%)" },
  REMARTIK:          { bg: "hsl(258 55% 95%)", color: "hsl(258 55% 38%)", border: "hsl(258 55% 78%)" },
  TRAFEGO:           { bg: "hsl(36  55% 95%)", color: "hsl(36  55% 30%)", border: "hsl(36  55% 70%)" },
  FC:                { bg: "hsl(142 45% 94%)", color: "hsl(142 45% 28%)", border: "hsl(142 45% 65%)" },
  LINK:              { bg: "hsl(20  60% 95%)", color: "hsl(20  60% 33%)", border: "hsl(20  60% 70%)" },
  FABRICA_INSTAGRAM: { bg: "hsl(190 50% 95%)", color: "hsl(190 50% 28%)", border: "hsl(190 50% 65%)" },
  TURBINAR:          { bg: "hsl(180 35% 94%)", color: "hsl(180 35% 27%)", border: "hsl(180 35% 62%)" },
  OUTRO:             { bg: "hsl(25   8% 93%)", color: "hsl(25   8% 33%)", border: "hsl(25   8% 63%)" },
}

export function CanalBadge({ canal }: { canal: CanalLead | string }) {
  const key = canal as CanalLead
  const colors = CANAL_COLORS[key]
  const label = CANAL_LABELS[key] ?? canal

  if (!colors) {
    return (
      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
        {label}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: colors.bg, color: colors.color, borderColor: colors.border }}
    >
      {label}
    </span>
  )
}
