import { currency } from "@/components/admin/charts/chart-theme";
import type { Heatmap as HeatmapData } from "@/lib/queries/dashboard";

// Heatmap puesto × día de Vendido Real (intensidad naranja). Estilo BI.
export function Heatmap({ data }: { data: HeatmapData }) {
  const { branches, dates, matrix, max } = data;
  if (branches.length === 0) {
    return <div className="text-sm text-neutral-500">Sin datos</div>;
  }
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[680px]">
        <div className="mb-1 flex">
          <div className="w-28 shrink-0" />
          {dates.map((d) => (
            <div key={d} className="flex-1 text-center text-[10px] tabular-nums text-neutral-500">{d.slice(8)}</div>
          ))}
        </div>
        {branches.map((b, bi) => (
          <div key={b} className="flex items-center">
            <div className="w-28 shrink-0 truncate pr-2 text-xs text-neutral-300">{b}</div>
            {matrix[bi].map((v, di) => {
              const a = max > 0 ? v / max : 0;
              return (
                <div
                  key={di}
                  className="mx-[2px] my-[2px] h-7 flex-1 rounded-md"
                  style={{ background: v > 0 ? `rgba(217,89,38,${(0.12 + a * 0.85).toFixed(3)})` : "rgba(255,255,255,0.03)" }}
                  title={`${b} · ${dates[di]}: ${currency(v)}`}
                />
              );
            })}
          </div>
        ))}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-500">
          <span>Menos</span>
          <span className="h-2.5 w-6 rounded" style={{ background: "rgba(217,89,38,0.15)" }} />
          <span className="h-2.5 w-6 rounded" style={{ background: "rgba(217,89,38,0.5)" }} />
          <span className="h-2.5 w-6 rounded" style={{ background: "rgba(217,89,38,0.95)" }} />
          <span>Más</span>
        </div>
      </div>
    </div>
  );
}
