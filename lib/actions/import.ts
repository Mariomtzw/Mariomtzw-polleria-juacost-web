"use server";

import { revalidatePath } from "next/cache";
import { assertOwner } from "@/lib/auth-guards";
import { parseSalesXlsx } from "@/lib/import/parseSalesXlsx";
import { importSales } from "@/lib/import/importSales";
import type { ImportSummary } from "@/lib/import/importSales";
import type { ActionResult } from "@/lib/actions/sales";

/**
 * Sube y procesa el Excel DESDE LA WEB, reutilizando el mismo parser de la
 * Fase 3. El dueño elige el archivo en la UI; aquí se parsea e importa.
 */
export async function importFromUpload(
  formData: FormData,
): Promise<ActionResult<ImportSummary>> {
  await assertOwner();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecciona un archivo .xlsx válido." };
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return { ok: false, error: "El archivo debe ser .xlsx" };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const sheet = await parseSalesXlsx(buffer);
    const summary = await importSales(sheet);

    revalidatePath("/admin");
    revalidatePath("/admin/ventas");
    return { ok: true, data: summary };
  } catch (err) {
    return { ok: false, error: `No se pudo importar: ${(err as Error).message}` };
  }
}
