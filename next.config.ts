import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // ExcelJS e xlsx usam módulos Node — precisam ser externos no server bundle
  serverExternalPackages: ["exceljs", "@prisma/client"],
  experimental: {
    // Habilita server actions em formulários nativos
  },
}

export default nextConfig
