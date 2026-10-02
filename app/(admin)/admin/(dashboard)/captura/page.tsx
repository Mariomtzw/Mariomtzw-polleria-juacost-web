import type { Metadata } from "next";
import { getDayCapture } from "@/lib/queries/capture";
import { resolveDateParam } from "@/lib/dates";
import { CaptureGrid } from "@/components/admin/CaptureGrid";
import { PageHeader } from "@/components/admin/ui/PageHeader";

export const metadata: Metadata = { title: "Captura del día" };

export default async function CapturaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const date = resolveDateParam(sp.date);
  const data = await getDayCapture(date);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Captura del día"
        description={`Registra los ${data.rows.length} puestos en una sola pantalla, como en tu Excel. Guarda con un clic.`}
      />
      {/* key: al cambiar de fecha la rejilla se reinicia con los datos de ese día */}
      <CaptureGrid key={date} data={data} />
    </div>
  );
}
