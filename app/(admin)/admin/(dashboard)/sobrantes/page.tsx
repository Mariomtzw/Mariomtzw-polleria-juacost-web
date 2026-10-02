import { prisma } from "@/lib/prisma";
import { LeftoverForm } from "@/components/admin/forms/LeftoverForm";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { currency } from "@/components/admin/charts/chart-theme";

interface LeftoverRow {
  id: string;
  date: string;
  branch: string;
  piece: string;
  quantity: number;
  unitPrice: number | null;
}

export default async function SobrantesPage() {
  const [branches, pieceTypes, leftovers] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.pieceType.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, label: true } }),
    prisma.leftover.findMany({
      orderBy: { date: "desc" },
      take: 60,
      select: {
        id: true,
        date: true,
        quantity: true,
        unitPrice: true,
        branch: { select: { name: true } },
        pieceType: { select: { label: true } },
      },
    }),
  ]);

  const rows: LeftoverRow[] = leftovers.map((l) => ({
    id: l.id,
    date: l.date.toISOString().slice(0, 10),
    branch: l.branch.name,
    piece: l.pieceType.label,
    quantity: l.quantity.toNumber(),
    unitPrice: l.unitPrice ? l.unitPrice.toNumber() : null,
  }));

  const columns: Column<LeftoverRow>[] = [
    { header: "Fecha", cell: (r) => r.date },
    { header: "Puesto", cell: (r) => r.branch },
    { header: "Pieza", cell: (r) => r.piece },
    { header: "Cantidad", cell: (r) => r.quantity, align: "right" },
    { header: "Precio unit.", cell: (r) => (r.unitPrice !== null ? currency(r.unitPrice) : "—"), align: "right" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-white">Sobrantes</h1>
      <LeftoverForm
        branches={branches}
        pieceTypes={pieceTypes.map((p) => ({ id: p.id, name: p.label }))}
      />
      <div>
        <h2 className="mb-3 text-sm font-medium text-neutral-300">Últimos registros</h2>
        <DataTable columns={columns} rows={rows} empty="Aún no hay sobrantes registrados" />
      </div>
    </div>
  );
}
