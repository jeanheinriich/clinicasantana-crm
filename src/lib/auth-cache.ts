import { cache } from "react"
import { auth } from "@/auth"

// auth() deduplicado por request via React cache()
// Garante uma única verificação JWT mesmo quando layout e página chamam getSession()
export const getSession = cache(auth)
