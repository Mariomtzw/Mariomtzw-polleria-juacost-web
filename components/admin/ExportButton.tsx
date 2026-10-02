import { Download } from "lucide-react";

// Descarga TODO el historial de ventas como .xlsx (endpoint protegido).
export function ExportButton() {
  return (
    <div className="material flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5">
      <div>
        <h3 className="font-medium text-white">Historial en Excel</h3>
        <p className="text-sm text-neutral-400">Descarga todas las ventas registradas en un archivo .xlsx.</p>
      </div>
      <a
        href="/api/export/xlsx"
        className="press inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-neutral-950 hover:bg-orange-400"
      >
        <Download size={16} /> Descargar historial
      </a>
    </div>
  );
}
