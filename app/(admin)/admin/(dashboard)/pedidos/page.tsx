import { prisma } from "@/lib/prisma";
import { OrderForm } from "@/components/admin/forms/OrderForm";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { currency } from "@/components/admin/charts/chart-theme";

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
      orderBy: { date: "desc" },
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
    { header: "Fecha", cell: (r) => r.date },
    { header: "Puesto", cell: (r) => r.branch },
    { header: "Monto", cell: (r) => currency(r.amount), align: "right" },
    { header: "Pollos", cell: (r) => (r.quantity ?? "—"), align: "right" },
    { header: "Notas", cell: (r) => r.notes ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-white">Pedidos</h1>
      <OrderForm branches={branches} />
      <div>
        <h2 className="mb-3 text-sm font-medium text-neutral-300">Últimos registros</h2>
        <DataTable columns={columns} rows={rows} empty="Aún no hay pedidos registrados" />
      </div>
    </div>
  );
}
