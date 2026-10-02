"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

export function DateNav({ date, base }: { date: string; base: string }) {
  const router = useRouter();
  const go = (d: string) => router.push(`${base}?date=${d}`);
  const shift = (n: number) => {
    const x = new Date(`${date}T00:00:00`); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => go(shift(-1))} className="press rounded-lg border border-white/10 bg-white/5 p-2 text-neutral-300 hover:bg-white/10"><ChevronLeft size={16} /></button>
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <CalendarDays size={16} className="text-orange-400" />
        <input type="date" value={date} onChange={(e) => go(e.target.value)} className="bg-transparent text-sm text-white outline-none" />
      </div>
      <button onClick={() => go(shift(1))} className="press rounded-lg border border-white/10 bg-white/5 p-2 text-neutral-300 hover:bg-white/10"><ChevronRight size={16} /></button>
      <button onClick={() => go(new Date().toISOString().slice(0, 10))} className="press rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 hover:bg-white/5">Hoy</button>
    </div>
  );
}
