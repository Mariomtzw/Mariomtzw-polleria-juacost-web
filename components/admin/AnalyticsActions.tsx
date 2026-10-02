"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CloudRain, Sparkles, PartyPopper } from "lucide-react";
import { refreshForecasts, backfillWeatherAndHolidays, createFiesta } from "@/lib/actions/insights";
import { shiftISO, todayISO } from "@/lib/dates";
import { Notice } from "@/components/admin/ui/Notice";

// Panel de acciones del pipeline de Data Science (todo protegido por assertOwner
// en el servidor). Cada botón dispara un server action y muestra el resultado.
export function AnalyticsActions() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [running, setRunning] = useState<"clima" | "pronostico" | "fiesta" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = (what: "clima" | "pronostico" | "fiesta", fn: () => Promise<{ ok: boolean; text: string }>) => {
    setMsg(null);
    setRunning(what);
    start(async () => {
      const result = await fn();
      setMsg(result);
      setRunning(null);
      if (result.ok) router.refresh();
    });
  };

  // onSubmit (no `action`): si hay un error, lo escrito se conserva.
  const onFiesta = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    for (const key of ["town", "radiusKm"]) if (fd.get(key) === "") fd.delete(key);
    run("fiesta", async () => {
      const res = await createFiesta(fd);
      if (!res.ok) return { ok: false, text: res.error };
      form.reset();
      return { ok: true, text: `Fiesta registrada · ${res.data?.linkedBranches ?? 0} puestos cercanos enlazados.` };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run("clima", async () => {
              const end = todayISO();
              const res = await backfillWeatherAndHolidays(shiftISO(end, -365), end);
              return res.ok
                ? { ok: true, text: `Clima: ${res.data?.weatherDays} días · Festivos: ${res.data?.holidays}.` }
                : { ok: false, text: res.error };
            })
          }
          className="btn btn-secondary"
        >
          <CloudRain aria-hidden size={16} /> {running === "clima" ? "Cargando clima…" : "Cargar clima (1 año) + festivos"}
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run("pronostico", async () => {
              const res = await refreshForecasts(14);
              return res.ok
                ? { ok: true, text: `Pronósticos: ${res.data?.forecasts} · Reales emparejados: ${res.data?.actuals}.` }
                : { ok: false, text: res.error };
            })
          }
          className="btn btn-primary"
        >
          <Sparkles aria-hidden size={16} /> {running === "pronostico" ? "Generando…" : "Generar pronósticos (14 días)"}
        </button>
      </div>

      {msg ? <Notice ok={msg.ok}>{msg.text}</Notice> : null}

      <form onSubmit={onFiesta} aria-labelledby="fiesta-title" className="material rounded-3xl p-5">
        <h3 id="fiesta-title" className="mb-1 flex items-center gap-2 font-medium text-white">
          <PartyPopper aria-hidden size={16} className="text-orange-400" /> Registrar fiesta patronal / municipal
        </h3>
        <p className="mb-4 text-xs text-neutral-400">
          La latitud y la longitud sirven para enlazar los puestos cercanos (en Google Maps: clic derecho sobre el lugar).
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="col-span-2">
            <label htmlFor="f-name" className="field-label">Nombre</label>
            <input id="f-name" name="name" required minLength={2} className="field" />
          </div>
          <div>
            <label htmlFor="f-type" className="field-label">Tipo</label>
            <select id="f-type" name="type" required className="field" defaultValue="PATRONAL_FIESTA">
              <option value="PATRONAL_FIESTA">Patronal</option>
              <option value="MUNICIPAL_FIESTA">Municipal</option>
              <option value="LOCAL_EVENT">Local</option>
            </select>
          </div>
          <div>
            <label htmlFor="f-town" className="field-label">Pueblo (opcional)</label>
            <input id="f-town" name="town" className="field" />
          </div>
          <div>
            <label htmlFor="f-lat" className="field-label">Latitud</label>
            <input id="f-lat" name="latitude" type="number" inputMode="decimal" step="any" min="-90" max="90" required className="field field-num" />
          </div>
          <div>
            <label htmlFor="f-lng" className="field-label">Longitud</label>
            <input id="f-lng" name="longitude" type="number" inputMode="decimal" step="any" min="-180" max="180" required className="field field-num" />
          </div>
          <div>
            <label htmlFor="f-start" className="field-label">Inicio</label>
            <input id="f-start" name="startDate" type="date" required className="field" />
          </div>
          <div>
            <label htmlFor="f-end" className="field-label">Fin (opcional)</label>
            <input id="f-end" name="endDate" type="date" className="field" />
          </div>
          <div>
            <label htmlFor="f-radius" className="field-label">Radio en km (si se deja vacío: 15)</label>
            <input id="f-radius" name="radiusKm" type="number" inputMode="decimal" step="0.1" min="0" className="field field-num" />
          </div>
        </div>
        <button type="submit" disabled={pending} className="btn btn-secondary mt-4">
          {running === "fiesta" ? "Registrando…" : "Registrar fiesta"}
        </button>
      </form>
    </div>
  );
}
