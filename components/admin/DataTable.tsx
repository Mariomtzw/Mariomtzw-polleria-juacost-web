import type { ReactNode } from "react";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
}

// Tabla simple y responsiva (server component). Vista tabular de respaldo
// para las gráficas (requisito de accesibilidad del skill dataviz).
export function DataTable<T>({
  columns,
  rows,
  empty = "Sin registros",
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-neutral-500">
        {empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-neutral-400">
            {columns.map((c, i) => (
              <th
                key={i}
                className={`px-4 py-3 font-medium ${c.align === "right" ? "text-right" : ""}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-white/5 last:border-0 hover:bg-white/5">
              {columns.map((c, ci) => (
                <td
                  key={ci}
                  className={`px-4 py-3 tabular-nums text-neutral-200 ${c.align === "right" ? "text-right" : ""}`}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
