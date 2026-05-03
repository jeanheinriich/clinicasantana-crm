"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createProtectedAction } from "@/lib/safe-action"
import { revalidatePath } from "next/cache"
import { LeadImportRowSchema } from "./schema"

const schema = z.object({
  rows: z.array(LeadImportRowSchema),
})

export const importLeadsAction = createProtectedAction(
  ["ADMIN", "GESTOR"],
  async (input: z.infer<typeof schema>, userId) => {
    const { rows } = schema.parse(input)

    const leadsToCreate = rows.map((row) => ({
      ...row,
      userId,
    }))

    const result = await prisma.lead.createMany({
      data: leadsToCreate,
    })

    revalidatePath("/leads")
    return { count: result.count }
  }
)

export type { LeadImportRow } from "./schema"
