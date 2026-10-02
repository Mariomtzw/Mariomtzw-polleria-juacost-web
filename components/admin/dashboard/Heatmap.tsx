import { currency } from "@/components/admin/charts/chart-theme";
import { formatDateShort } from "@/lib/dates";
import type { Heatmap as HeatmapData } from "@/lib/queries/dashboard";

const DAY_INITIAL = ["D", "L", "M", "X", "J", "V", "S"];

// Heatmap puesto × día de Vendido Real (intensidad naranja). Estilo BI.
// Es una tabla real: cada celda lleva su valor para lectores de pantalla y
// como texto emergente; la columna de puestos queda fija al desplazar.
export function Heatmap({ data }: { data: HeatmapData }) {
  const { branches, dates, matrix, max } = data;
  if (branches.length === 0) {
    return <div className="text-sm text-neutral-400">Sin datos</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="relative w-full min-w-[680px] border-separate border-spacing-[3px] text-xs">
        <caption className="sr-only">Vendido real por puesto y día</caption>
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 z-10 w-28 bg-[#171717]"><span className="sr-only">Puesto</span></th>
            {dates.map((d) => (
              <th key={d} scope="col" className="pb-1 text-center text-[11px] font-normal tabular-nums text-neutral-400">
                <span aria-hidden>
                  {DAY_INITIAL[new Date(`${d}T00:00:00Z`).getUTCDay()]}
                  <span className="block text-neutral-300">{Number(d.slice(8))}</span>
                </span>
                <span className="sr-only">{formatDateShort(d)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {branches.map((b, bi) => (
            <tr key={b}>
              <th scope="row" className="sticky left-0 z-10 max-w-28 truncate bg-[#171717] pr-2 text-left font-normal text-neutral-300">
                {b}
              </th>
              {matrix[bi].map((v, di) => {
                const a = max > 0 ? v / max : 0;
                return (
                  <td
                    key={di}
                    className="h-7 rounded-md"
                    style={{ background: v > 0 ? `rgba(217,89,38,${(0.12 + a * 0.85).toFixed(3)})` : "rgba(255,255,255,0.04)" }}
                    title={`${b} · ${formatDateShort(dates[di])}: ${v > 0 ? currency(v) : "sin registro"}`}
                  >
                    <span className="sr-only">{v > 0 ? currency(v) : "Sin registro"}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-2 text-xs text-neutral-400">
        <span>Menos</span>
        <span aria-hidden className="h-2.5 w-6 rounded" style={{ background: "rgba(217,89,38,0.15)" }} />
        <span aria-hidden className="h-2.5 w-6 rounded" style={{ background: "rgba(217,89,38,0.5)" }} />
        <span aria-hidden className="h-2.5 w-6 rounded" style={{ background: "rgba(217,89,38,0.95)" }} />
        <span>Más</span>
        <span className="ml-3 flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-6 rounded" style={{ background: "rgba(255,255,255,0.04)", outline: "1px solid rgba(255,255,255,0.12)" }} />
          Sin registro
        </span>
      </div>
    </div>
  );
}
