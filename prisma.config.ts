import path from "node:path";
import { defineConfig } from "prisma/config";

// Con prisma.config.ts, Prisma ya NO carga .env automáticamente: lo hacemos aquí
// para que migrate/seed lean DATABASE_URL y DIRECT_URL. (Node 20.12+/22+/25)
try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // En Vercel las variables ya vienen del entorno; el .env es opcional.
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
