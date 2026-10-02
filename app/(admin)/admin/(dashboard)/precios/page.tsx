import { getAllFreshPrices } from "@/lib/queries/prices";
import { FreshPriceGrid } from "@/components/admin/FreshPriceGrid";

export default async function PreciosPage() {
  const data = await getAllFreshPrices();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Precios de pieza (fresco)</h1>
        <p className="text-sm text-neutral-400">Modifica los precios por pieza de cada puesto cuando cambien. "Pollo entero" se calcula solo.</p>
      </div>
      <FreshPriceGrid data={data} />
    </div>
  );
}
