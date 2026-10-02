import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDateShort } from "@/lib/dates";
import { OrderForm } from "@/components/admin/forms/OrderForm";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader, SectionTitle } from "@/components/admin/ui/PageHeader";
import { currency } from "@/components/admin/charts/chart-theme";

export const metadata: Metadata = { title: "Pedidos" };

interface OrderRow {
  id: string;
  date: string;
  branch: string;
  amount: number;
  quantity: number | null;
  notes: string | null;
}

export default async function PedidosPage() {
  const [branches, orders] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.order.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 60,
      select: {
        id: true,
        date: true,
        amount: true,
        quantity: true,
        notes: true,
        branch: { select: { name: true } },
      },
    }),
  ]);

  const rows: OrderRow[] = orders.map((o) => ({
    id: o.id,
    date: o.date.toISOString().slice(0, 10),
    branch: o.branch.name,
    amount: o.amount.toNumber(),
    quantity: o.quantity,
    notes: o.notes,
  }));

  const columns: Column<OrderRow>[] = [
    { header: "Fecha", cell: (r) => <span className="whitespace-nowrap">{formatDateShort(r.date)}</span> },
    { header: "Puesto", cell: (r) => r.branch },
    { header: "Monto", cell: (r) => currency(r.amount), align: "right" },
    { header: "Pollos", cell: (r) => (r.quantity ?? "—"), align: "right" },
    { header: "Notas", cell: (r) => r.notes || "—" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Pedidos" description="Pedidos especiales por puesto (fiestas, negocios, encargos)." />
      <OrderForm branches={branches} />
      <section aria-labelledby="pedidos-ultimos">
        <SectionTitle id="pedidos-ultimos">Últimos registros</SectionTitle>
        <DataTable columns={columns} rows={rows} caption="Últimos pedidos registrados" empty="Aún no hay pedidos registrados" />
      </section>
    </div>
  );
}
