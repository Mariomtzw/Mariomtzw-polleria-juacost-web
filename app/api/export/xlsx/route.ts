import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { equivalentesVendidos, diferenciaPollos, tierFor, getThresholds } from "@/lib/calculations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIER_LABEL: Record<string, string> = { GREEN: "Buena", YELLOW: "Regular", RED: "Baja" };

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [sales, thresholds] = await Promise.all([
    prisma.dailySale.findMany({
      orderBy: [{ date: "asc" }, { branch: { code: "asc" } }],
      select: {
        date: true, pollosAsignados: true, valorEstimado: true, vendidoReal: true, precioPorPieza: true,
        branch: { select: { name: true } }, seller: { select: { name: true } },
      },
    }),
    getThresholds(),
  ]);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Historial");
  ws.columns = [
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Puesto", key: "puesto", width: 18 },
    { header: "Vendedora", key: "vendedora", width: 14 },
    { header: "Pollos", key: "pollos", width: 9 },
    { header: "Valor estimado", key: "estimado", width: 15 },
    { header: "Vendido real", key: "real", width: 14 },
    { header: "$/pieza", key: "pieza", width: 10 },
    { header: "Equivalentes", key: "equiv", width: 13 },
    { header: "Diferencia", key: "dif", width: 11 },
    { header: "Semáforo", key: "semaforo", width: 10 },
  ];

  for (const s of sales) {
    const ppp = s.precioPorPieza.toNumber();
    const eq = equivalentesVendidos(s.vendidoReal.toNumber(), ppp);
    const dif = diferenciaPollos(s.pollosAsignados.toNumber(), eq);
    ws.addRow({
      fecha: s.date.toISOString().slice(0, 10),
      puesto: s.branch.name,
      vendedora: s.seller.name,
      pollos: s.pollosAsignados.toNumber(),
      estimado: s.valorEstimado.toNumber(),
      real: s.vendidoReal.toNumber(),
      pieza: ppp,
      equiv: Number(eq.toFixed(2)),
      dif: Number(dif.toFixed(2)),
      semaforo: TIER_LABEL[tierFor(dif, thresholds)] ?? "",
    });
  }
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="pollos-juacost-historial.xlsx"',
    },
  });
}
