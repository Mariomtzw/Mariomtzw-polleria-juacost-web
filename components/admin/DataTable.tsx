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
  caption,
  empty = "Sin registros",
}: {
  columns: Column<T>[];
  rows: T[];
  /** Describe la tabla para lectores de pantalla (no se ve). */
  caption?: string;
  empty?: string;
}) {
  if (rows.length === 0) {
    return <div className="material rounded-3xl p-8 text-center text-sm text-neutral-400">{empty}</div>;
  }

  return (
    <div className="material overflow-x-auto rounded-3xl">
      <table className="table">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} scope="col" className={c.align === "right" ? "num" : ""}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {columns.map((c, ci) => (
                <td key={ci} className={`text-neutral-200 ${c.align === "right" ? "num" : ""}`}>
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
