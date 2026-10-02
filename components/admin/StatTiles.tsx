import { TrendingUp, DollarSign, Drumstick, CalendarDays } from "lucide-react";
import { currency } from "@/components/admin/charts/chart-theme";
import type { DashboardTotals } from "@/lib/queries/analytics";

// Stat tiles (hero numbers) — no es una gráfica; es la lectura de un vistazo.
export function StatTiles({ totals }: { totals: DashboardTotals }) {
  const cumplimiento =
    totals.valorEstimado > 0 ? (totals.vendidoReal / totals.valorEstimado) * 100 : 0;

  const tiles = [
    { label: "Vendido Real", value: currency(totals.vendidoReal), icon: DollarSign },
    { label: "Valor Estimado", value: currency(totals.valorEstimado), icon: TrendingUp },
    { label: "Cumplimiento", value: `${cumplimiento.toFixed(0)}%`, icon: TrendingUp },
    { label: "Pollos asignados", value: totals.pollosAsignados.toLocaleString("es-MX"), icon: Drumstick },
    { label: "Días con registro", value: String(totals.dias), icon: CalendarDays },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {tiles.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
        >
          <div className="mb-2 flex items-center gap-2 text-neutral-400">
            <Icon size={15} />
            <span className="text-xs">{label}</span>
          </div>
          <p className="text-xl font-semibold tabular-nums text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}
