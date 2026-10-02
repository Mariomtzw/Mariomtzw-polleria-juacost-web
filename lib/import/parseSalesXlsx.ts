import ExcelJS from "exceljs";
import type { PiecePrices } from "@/lib/pricing";

export interface ParsedSaleRow {
  branchName: string; // "S.M. Manuela" (ya sin espacios sobrantes)
  salario: number | null; // columna B, opcional
  pollosAsignados: number;
  valorEstimado: number;
  vendidoReal: number;
  precios: PiecePrices;
}

export interface ParsedSheet {
  date: Date; // fecha de la hoja (B2)
  rows: ParsedSaleRow[];
}

// Columnas fijas confirmadas del layout de "Pollos Juacost.xlsx"
// C=nombre, B=salario, D=pollos, E=valor estimado, F=vendido real
// J..Q = 8 piezas (pechuga, pierna, ala, huacal, rabadilla, higado, pata, cabeza)
const COL = {
  salario: 2, // B
  name: 3, // C
  pollos: 4, // D
  valorEstimado: 5, // E
  vendidoReal: 6, // F
  pechuga: 10, // J
  pierna: 11, // K
  ala: 12, // L
  huacal: 13, // M
  rabadilla: 14, // N
  higado: 15, // O
  pata: 16, // P
  cabeza: 17, // Q
} as const;

function toNumber(value: ExcelJS.CellValue): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  // Celdas con fórmula: { result: number }
  if (typeof value === "object" && value !== null && "result" in value) {
    const r = (value as { result?: unknown }).result;
    return typeof r === "number" ? r : null;
  }
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

function toText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && value !== null && "result" in value) {
    return String((value as { result?: unknown }).result ?? "").trim();
  }
  return String(value).trim();
}

/** Lee la fecha desde la celda B2 (junto a "Fecha"). */
function readSheetDate(ws: ExcelJS.Worksheet): Date {
  const b2 = ws.getCell("B2").value;
  if (b2 instanceof Date) return b2;
  const asText = toText(b2);
  const parsed = new Date(asText);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  throw new Error(`No pude leer la fecha de la hoja (celda B2). Valor: ${asText}`);
}

/**
 * Parsea el archivo a estructura tipada. NO toca la base de datos.
 * Recorre desde la fila 5 hasta encontrar "Total" o una fila sin nombre.
 */
export async function parseSalesXlsx(source: string | Buffer): Promise<ParsedSheet> {
  const wb = new ExcelJS.Workbook();
  if (typeof source === "string") {
    await wb.xlsx.readFile(source);
  } else {
    await wb.xlsx.load(source);
  }

  const ws = wb.worksheets[0];
  if (!ws) throw new Error("El archivo no tiene hojas.");

  const date = readSheetDate(ws);
  const rows: ParsedSaleRow[] = [];

  const FIRST_DATA_ROW = 5;
  const LAST_POSSIBLE_ROW = ws.rowCount;

  for (let r = FIRST_DATA_ROW; r <= LAST_POSSIBLE_ROW; r++) {
    const name = toText(ws.getRow(r).getCell(COL.name).value);
    if (!name) break; // fila vacía => fin
    if (name.toLowerCase() === "total") break; // llegamos al total

    const pollos = toNumber(ws.getRow(r).getCell(COL.pollos).value);
    const valorEstimado = toNumber(ws.getRow(r).getCell(COL.valorEstimado).value);
    const vendidoReal = toNumber(ws.getRow(r).getCell(COL.vendidoReal).value);
    if (pollos === null || valorEstimado === null || vendidoReal === null) continue;

    const precios: PiecePrices = {
      precioPechuga: toNumber(ws.getRow(r).getCell(COL.pechuga).value) ?? 0,
      precioPierna: toNumber(ws.getRow(r).getCell(COL.pierna).value) ?? 0,
      precioAla: toNumber(ws.getRow(r).getCell(COL.ala).value) ?? 0,
      precioHuacal: toNumber(ws.getRow(r).getCell(COL.huacal).value) ?? 0,
      precioRabadilla: toNumber(ws.getRow(r).getCell(COL.rabadilla).value) ?? 0,
      precioHigado: toNumber(ws.getRow(r).getCell(COL.higado).value) ?? 0,
      precioPata: toNumber(ws.getRow(r).getCell(COL.pata).value) ?? 0,
      precioCabeza: toNumber(ws.getRow(r).getCell(COL.cabeza).value) ?? 0,
    };

    rows.push({
      branchName: name.replace(/\s+/g, " ").trim(),
      salario: toNumber(ws.getRow(r).getCell(COL.salario).value),
      pollosAsignados: pollos,
      valorEstimado,
      vendidoReal,
      precios,
    });
  }

  if (rows.length === 0) {
    throw new Error("No encontré filas de puestos en la hoja.");
  }

  return { date, rows };
}
