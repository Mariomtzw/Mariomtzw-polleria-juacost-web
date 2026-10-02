import { prisma } from "@/lib/prisma";
import { precioPorPieza } from "@/lib/pricing";
import type { ParsedSheet, ParsedSaleRow } from "@/lib/import/parseSalesXlsx";

export interface ImportSummary {
  date: string;
  created: number;
  updated: number;
  skipped: string[]; // puestos que no se pudieron enlazar
}

/**
 * Deriva la vendedora del nombre del puesto: "S.M. Manuela" -> "Manuela".
 * Toma el último token; suficiente para los nombres de tu hoja.
 */
function sellerNameFromBranch(branchName: string): string {
  const parts = branchName.split(" ").filter(Boolean);
  return parts[parts.length - 1] ?? branchName;
}

async function resolveBranchAndSeller(row: ParsedSaleRow) {
  // 1) Puesto: por nombre exacto; si no existe, lo creamos con un code nuevo.
  let branch = await prisma.branch.findFirst({ where: { name: row.branchName } });
  if (!branch) {
    const count = await prisma.branch.count();
    branch = await prisma.branch.create({
      data: {
        name: row.branchName,
        code: `P${String(count + 1).padStart(2, "0")}`,
        isActive: true,
      },
    });
  }

  // 2) Vendedora: la registrada en el puesto, o la derivada del nombre.
  let seller = await prisma.seller.findFirst({ where: { branchId: branch.id, isActive: true } });
  if (!seller) {
    seller = await prisma.seller.create({
      data: { name: sellerNameFromBranch(row.branchName), branchId: branch.id, isActive: true },
    });
  }

  return { branch, seller };
}

/**
 * Escribe en la base de datos el contenido parseado de una hoja (un día).
 * Idempotente: si vuelves a importar la misma fecha, ACTUALIZA (no duplica).
 * Guarda el snapshot de los 8 precios + precioPorPieza en cada DailySale.
 */
export async function importSales(sheet: ParsedSheet): Promise<ImportSummary> {
  const summary: ImportSummary = {
    date: sheet.date.toISOString().slice(0, 10),
    created: 0,
    updated: 0,
    skipped: [],
  };

  for (const row of sheet.rows) {
    try {
      const { branch, seller } = await resolveBranchAndSeller(row);
      const ppp = precioPorPieza(row.precios);

      const existing = await prisma.dailySale.findUnique({
        where: { date_branchId: { date: sheet.date, branchId: branch.id } },
        select: { id: true },
      });

      await prisma.dailySale.upsert({
        where: { date_branchId: { date: sheet.date, branchId: branch.id } },
        create: {
          date: sheet.date,
          branchId: branch.id,
          sellerId: seller.id,
          pollosAsignados: row.pollosAsignados,
          valorEstimado: row.valorEstimado,
          vendidoReal: row.vendidoReal,
          ...row.precios,
          precioPorPieza: ppp,
        },
        update: {
          sellerId: seller.id,
          pollosAsignados: row.pollosAsignados,
          valorEstimado: row.valorEstimado,
          vendidoReal: row.vendidoReal,
          ...row.precios,
          precioPorPieza: ppp,
        },
      });

      if (existing) summary.updated++;
      else summary.created++;
    } catch (err) {
      summary.skipped.push(`${row.branchName}: ${(err as Error).message}`);
    }
  }

  return summary;
}
