"use client";

import { useState, useTransition } from "react";
import { CloudRain, Sparkles, PartyPopper } from "lucide-react";
import { refreshForecasts, backfillWeatherAndHolidays, createFiesta } from "@/lib/actions/insights";

const field =
  "w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-orange-500";
const label = "mb-1 block text-xs text-neutral-400";

// Panel de acciones del pipeline de Data Science (todo protegido por assertOwner
// en el servidor). Cada botón dispara un server action y muestra el resultado.
export function AnalyticsActions() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const run = (fn: () => Promise<string>) => {
    setMsg(null);
    start(async () => setMsg(await fn()));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const end = new Date().toISOString().slice(0, 10);
              const start = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
              const res = await backfillWeatherAndHolidays(start, end);
              return res.ok
                ? `Clima: ${res.data?.weatherDays} días · Festivos: ${res.data?.holidays}`
                : res.error;
            })
          }
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 hover:bg-white/10 disabled:opacity-50"
        >
          <CloudRain size={16} /> Cargar clima (1 año) + festivos
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const res = await refreshForecasts(14);
              return res.ok
                ? `Pronósticos: ${res.data?.forecasts} · Reales emparejados: ${res.data?.actuals}`
                : res.error;
            })
          }
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-orange-400 disabled:opacity-50"
        >
          <Sparkles size={16} /> Generar pronósticos (14 días)
        </button>
      </div>

      <form
        action={(fd) => run(async () => {
          const res = await createFiesta(fd);
          return res.ok ? `Fiesta creada · ${res.data?.linkedBranches} puestos cercanos enlazados` : res.error;
        })}
        className="rounded-2xl border border-white/10 bg-white/5 p-4"
      >
        <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-200">
          <PartyPopper size={16} /> Registrar fiesta patronal / municipal
        </h4>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="col-span-2"><label className={label}>Nombre</label><input name="name" required className={field} /></div>
          <div><label className={label}>Tipo</label>
            <select name="type" required className={field} defaultValue="PATRONAL_FIESTA">
              <option value="PATRONAL_FIESTA">Patronal</option>
              <option value="MUNICIPAL_FIESTA">Municipal</option>
              <option value="LOCAL_EVENT">Local</option>
            </select>
          </div>
          <div><label className={label}>Pueblo</label><input name="town" className={field} /></div>
          <div><label className={label}>Latitud</label><input name="latitude" type="number" step="any" required className={field} /></div>
          <div><label className={label}>Longitud</label><input name="longitude" type="number" step="any" required className={field} /></div>
          <div><label className={label}>Inicio</label><input name="startDate" type="date" required className={field} /></div>
          <div><label className={label}>Fin (opcional)</label><input name="endDate" type="date" className={field} /></div>
          <div><label className={label}>Radio km (def. 15)</label><input name="radiusKm" type="number" step="0.1" className={field} /></div>
        </div>
        <button type="submit" disabled={pending} className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50">
          {pending ? "Procesando…" : "Registrar fiesta"}
        </button>
      </form>

      {msg ? <p className="text-sm text-amber-300">{msg}</p> : null}
    </div>
  );
}
