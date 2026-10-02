import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDateShort } from "@/lib/dates";
import { LeftoverForm } from "@/components/admin/forms/LeftoverForm";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader, SectionTitle } from "@/components/admin/ui/PageHeader";
import { currency } from "@/components/admin/charts/chart-theme";

export const metadata: Metadata = { title: "Sobrantes" };

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
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
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
    { header: "Fecha", cell: (r) => <span className="whitespace-nowrap">{formatDateShort(r.date)}</span> },
    { header: "Puesto", cell: (r) => r.branch },
    { header: "Pieza", cell: (r) => r.piece },
    { header: "Cantidad", cell: (r) => r.quantity, align: "right" },
    { header: "Precio unit.", cell: (r) => (r.unitPrice !== null ? currency(r.unitPrice) : "—"), align: "right" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Sobrantes" description="Historial de sobrantes por puesto y pieza. El día a día se captura en Sobras y Frío." />
      <LeftoverForm
        branches={branches}
        pieceTypes={pieceTypes.map((p) => ({ id: p.id, name: p.label }))}
      />
      <section aria-labelledby="sobrantes-ultimos">
        <SectionTitle id="sobrantes-ultimos">Últimos registros</SectionTitle>
        <DataTable columns={columns} rows={rows} caption="Últimos sobrantes registrados" empty="Aún no hay sobrantes registrados" />
      </section>
    </div>
  );
}
