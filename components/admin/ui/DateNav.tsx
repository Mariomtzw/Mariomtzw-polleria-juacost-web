"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateLong, isISODate, shiftISO, todayISO } from "@/lib/dates";

/**
 * Barra de fecha de las pantallas por día (captura, corte, sobras y frío).
 * Cambia el parámetro `?date=` de la página `base`.
 */
export function DateNav({ date, base }: { date: string; base: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const today = todayISO();
  const isToday = date === today;

  const go = (next: string) => {
    if (!isISODate(next) || next === date) return;
    startTransition(() => router.push(`${base}?date=${next}`));
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2" aria-busy={pending}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => go(shiftISO(date, -1))} className="btn btn-icon btn-secondary" aria-label="Día anterior">
          <ChevronLeft aria-hidden size={18} />
        </button>
        <label className="sr-only" htmlFor="date-nav">
          Fecha
        </label>
        <input
          id="date-nav"
          type="date"
          value={date}
          onChange={(e) => go(e.target.value)}
          className="field w-auto tabular-nums"
        />
        <button type="button" onClick={() => go(shiftISO(date, 1))} className="btn btn-icon btn-secondary" aria-label="Día siguiente">
          <ChevronRight aria-hidden size={18} />
        </button>
        <button type="button" onClick={() => go(today)} disabled={isToday} className="btn btn-secondary">
          Hoy
        </button>
      </div>
      <p className={`text-sm first-letter:uppercase ${pending ? "text-neutral-500" : "text-neutral-300"}`}>
        {formatDateLong(date)}
        {isToday ? <span className="ml-2 rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-300">Hoy</span> : null}
      </p>
    </div>
  );
}
