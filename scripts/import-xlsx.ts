/**
 * Importador CLI del historial desde Excel.
 *
 * Uso:
 *   npx tsx scripts/import-xlsx.ts "/ruta/a/Pollos Juacost.xlsx"
 *
 * Puedes pasar VARIOS archivos (uno por día):
 *   npx tsx scripts/import-xlsx.ts dia1.xlsx dia2.xlsx dia3.xlsx
 *
 * Es idempotente: reimportar la misma fecha actualiza, no duplica.
 */
import { parseSalesXlsx } from "@/lib/import/parseSalesXlsx";
import { importSales } from "@/lib/import/importSales";
import { prisma } from "@/lib/prisma";

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Uso: npx tsx scripts/import-xlsx.ts "/ruta/a/Pollos Juacost.xlsx" [...]');
    process.exit(1);
  }

  for (const file of files) {
    try {
      const sheet = await parseSalesXlsx(file);
      const summary = await importSales(sheet);
      console.log(
        `✓ ${file}  [${summary.date}]  creados: ${summary.created}, actualizados: ${summary.updated}` +
          (summary.skipped.length ? `, omitidos: ${summary.skipped.length}` : ""),
      );
      for (const s of summary.skipped) console.warn(`   ⚠ ${s}`);
    } catch (err) {
      console.error(`✗ ${file}: ${(err as Error).message}`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
