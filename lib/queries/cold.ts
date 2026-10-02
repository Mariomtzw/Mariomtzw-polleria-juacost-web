import { prisma } from "@/lib/prisma";

export interface ColdPiece { pieceTypeId: string; code: string; label: string }
export interface ColdStockRow {
  id: string; branchId: string; branchName: string;
  pieceTypeId: string; pieceLabel: string;
  quantityReceived: number; unitPrice: number; quantitySold: number;
}
export interface LeftoverPool { pieceTypeId: string; label: string; quantity: number }
export interface TodayLeftover { id: string; branchName: string; pieceLabel: string; quantity: number }
export interface ColdPriceRow { branchId: string; pieceTypeId: string; price: number }

export interface ColdDay {
  date: string;
  pieces: ColdPiece[];
  branches: { id: string; name: string }[];
  stock: ColdStockRow[];
  pool: LeftoverPool[];             // sobrante del día ANTERIOR (disponible para frío)
  todayLeftovers: TodayLeftover[];  // sobras registradas HOY
  coldPrices: ColdPriceRow[];
}

export async function getColdDay(dateStr: string): Promise<ColdDay> {
  const date = new Date(`${dateStr}T00:00:00`);
  const prev = new Date(date); prev.setDate(prev.getDate() - 1);

  const [pieces, branches, stock, prevLeftovers, todayLeftovers, prices] = await Promise.all([
    prisma.pieceType.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, code: true, label: true } }),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { code: "asc" }, select: { id: true, name: true } }),
    prisma.coldStock.findMany({
      where: { date }, orderBy: [{ branch: { code: "asc" } }, { pieceType: { sortOrder: "asc" } }],
      include: { branch: { select: { name: true } }, pieceType: { select: { label: true } } },
    }),
    prisma.leftover.findMany({ where: { date: prev }, select: { pieceTypeId: true, quantity: true } }),
    prisma.leftover.findMany({
      where: { date }, orderBy: [{ branch: { code: "asc" } }],
      include: { branch: { select: { name: true } }, pieceType: { select: { label: true } } },
    }),
    prisma.coldPiecePrice.findMany({ where: { isActive: true }, select: { branchId: true, pieceTypeId: true, price: true } }),
  ]);

  const poolMap = new Map<string, number>();
  for (const l of prevLeftovers) poolMap.set(l.pieceTypeId, (poolMap.get(l.pieceTypeId) ?? 0) + l.quantity.toNumber());
  const labelById = new Map(pieces.map((p) => [p.id, p.label]));

  return {
    date: dateStr,
    pieces: pieces.map((p) => ({ pieceTypeId: p.id, code: p.code, label: p.label })),
    branches,
    stock: stock.map((s) => ({
      id: s.id, branchId: s.branchId, branchName: s.branch.name,
      pieceTypeId: s.pieceTypeId, pieceLabel: s.pieceType.label,
      quantityReceived: s.quantityReceived.toNumber(), unitPrice: s.unitPrice.toNumber(), quantitySold: s.quantitySold.toNumber(),
    })),
    pool: [...poolMap.entries()].map(([id, q]) => ({ pieceTypeId: id, label: labelById.get(id) ?? "", quantity: q })),
    todayLeftovers: todayLeftovers.map((l) => ({ id: l.id, branchName: l.branch.name, pieceLabel: l.pieceType.label, quantity: l.quantity.toNumber() })),
    coldPrices: prices.map((p) => ({ branchId: p.branchId, pieceTypeId: p.pieceTypeId, price: p.price.toNumber() })),
  };
}
