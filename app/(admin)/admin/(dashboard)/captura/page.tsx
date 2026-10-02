import { getDayCapture } from "@/lib/queries/capture";
import { CaptureGrid } from "@/components/admin/CaptureGrid";

export default async function CapturaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const date =
    sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date)
      ? sp.date
      : new Date().toISOString().slice(0, 10);

  const data = await getDayCapture(date);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Captura del día</h1>
        <p className="text-sm text-neutral-400">
          Registra los 9 puestos en una sola pantalla, como en tu Excel. Guarda con un clic.
        </p>
      </div>
      <CaptureGrid data={data} />
    </div>
  );
}
