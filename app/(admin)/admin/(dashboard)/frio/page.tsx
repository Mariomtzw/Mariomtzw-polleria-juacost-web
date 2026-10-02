import { getColdDay } from "@/lib/queries/cold";
import { ColdManager } from "@/components/admin/ColdManager";
import { LeftoverCapture } from "@/components/admin/LeftoverCapture";
import { DateNav } from "@/components/admin/ui/DateNav";

export default async function FrioPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : new Date().toISOString().slice(0, 10);
  const data = await getColdDay(date);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Sobras y Pollo Frío</h1>
        <p className="text-sm text-neutral-400">Registra las sobras del día, distribuye el sobrante de ayer como frío y controla su venta.</p>
      </div>
      <DateNav date={date} base="/admin/frio" />
      <LeftoverCapture data={data} />
      <ColdManager data={data} />
    </div>
  );
}
