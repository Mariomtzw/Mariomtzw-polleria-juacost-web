import type { Metadata } from "next";
import { getColdDay } from "@/lib/queries/cold";
import { resolveDateParam } from "@/lib/dates";
import { ColdManager } from "@/components/admin/ColdManager";
import { LeftoverCapture } from "@/components/admin/LeftoverCapture";
import { DateNav } from "@/components/admin/ui/DateNav";
import { PageHeader } from "@/components/admin/ui/PageHeader";

export const metadata: Metadata = { title: "Sobras y Frío" };

export default async function FrioPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const date = resolveDateParam(sp.date);
  const data = await getColdDay(date);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sobras y Pollo Frío"
        description="Registra las sobras del día, distribuye el sobrante del día anterior como frío y controla su venta."
      />
      <DateNav date={date} base="/admin/frio" />
      {/* key: al cambiar de fecha los formularios se reinician con ese día */}
      <LeftoverCapture key={`sobras-${date}`} data={data} />
      <ColdManager key={`frio-${date}`} data={data} />
    </div>
  );
}
