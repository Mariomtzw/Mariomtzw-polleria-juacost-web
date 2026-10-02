import type { Metadata } from "next";
import { getAllFreshPrices } from "@/lib/queries/prices";
import { FreshPriceGrid } from "@/components/admin/FreshPriceGrid";
import { PageHeader } from "@/components/admin/ui/PageHeader";

export const metadata: Metadata = { title: "Precios" };

export default async function PreciosPage() {
  const data = await getAllFreshPrices();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Precios de pieza (fresco)"
        description="Modifica los precios por pieza de cada puesto cuando cambien. «Pollo entero» se calcula solo."
      />
      <FreshPriceGrid data={data} />
    </div>
  );
}
