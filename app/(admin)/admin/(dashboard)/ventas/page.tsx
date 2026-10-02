import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDateShort } from "@/lib/dates";
import { DailySaleForm } from "@/components/admin/forms/DailySaleForm";
import { ExportButton } from "@/components/admin/ExportButton";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader, SectionTitle } from "@/components/admin/ui/PageHeader";
import { currency } from "@/components/admin/charts/chart-theme";

export const metadata: Metadata = { title: "Ventas" };

interface SaleRow {
  id: string;
  date: string;
  branch: string;
  seller: string;
  pollos: number;
  valorEstimado: number;
  vendidoReal: number;
  precioPorPieza: number;
}

export default async function VentasPage() {
  const [branches, sellers, sales] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.seller.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.dailySale.findMany({
      orderBy: [{ date: "desc" }, { branch: { code: "asc" } }],
      take: 60,
      select: {
        id: true,
        date: true,
        pollosAsignados: true,
        valorEstimado: true,
        vendidoReal: true,
        precioPorPieza: true,
        branch: { select: { name: true } },
        seller: { select: { name: true } },
      },
    }),
  ]);

  const rows: SaleRow[] = sales.map((s) => ({
    id: s.id,
    date: s.date.toISOString().slice(0, 10),
    branch: s.branch.name,
    seller: s.seller.name,
    pollos: s.pollosAsignados.toNumber(),
    valorEstimado: s.valorEstimado.toNumber(),
    vendidoReal: s.vendidoReal.toNumber(),
    precioPorPieza: s.precioPorPieza.toNumber(),
  }));

  const columns: Column<SaleRow>[] = [
    { header: "Fecha", cell: (r) => <span className="whitespace-nowrap">{formatDateShort(r.date)}</span> },
    { header: "Puesto", cell: (r) => r.branch },
    { header: "Vendedora", cell: (r) => r.seller },
    { header: "Pollos", cell: (r) => r.pollos, align: "right" },
    { header: "Estimado", cell: (r) => currency(r.valorEstimado), align: "right" },
    { header: "Vendido", cell: (r) => currency(r.vendidoReal), align: "right" },
    { header: "$/pieza", cell: (r) => currency(r.precioPorPieza), align: "right" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Ventas" description="Registra la venta de un puesto y consulta los últimos registros. Para capturar todos los puestos del día, usa Captura del día." />
      <DailySaleForm branches={branches} sellers={sellers} />
      <ExportButton />
      <section aria-labelledby="ventas-ultimos">
        <SectionTitle id="ventas-ultimos">Últimos {rows.length} registros</SectionTitle>
        <DataTable columns={columns} rows={rows} caption="Últimas ventas registradas" empty="Aún no hay ventas registradas" />
      </section>
    </div>
  );
}
