import { Download } from "lucide-react";

// Descarga TODO el historial de ventas como .xlsx (endpoint protegido).
export function ExportButton() {
  return (
    <section aria-labelledby="export-title" className="material flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5">
      <div>
        <h2 id="export-title" className="font-medium text-white">Historial en Excel</h2>
        <p className="text-sm text-neutral-400">Descarga todas las ventas registradas en un archivo .xlsx.</p>
      </div>
      {/* <a> normal (no <Link>): es una descarga, no una pantalla del panel */}
      <a href="/api/export/xlsx" download className="btn btn-primary">
        <Download aria-hidden size={16} /> Descargar historial
      </a>
    </section>
  );
}
