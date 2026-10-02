import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList } from "lucide-react";
import { formatDateLong } from "@/lib/dates";
import { currency } from "@/components/admin/charts/chart-theme";
import type { TodayStatus } from "@/lib/queries/dashboard";

// Lo primero que ve el dueño al entrar: cómo va la captura de hoy y el
// siguiente paso (capturar lo que falta o revisar el corte).
export function TodayCard({ status }: { status: TodayStatus }) {
  const { date, captured, total, vendidoReal } = status;
  const done = total > 0 && captured >= total;
  const missing = Math.max(0, total - captured);
  const Icon = done ? CheckCircle2 : ClipboardList;

  return (
    <section aria-labelledby="hoy-title" className="material flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-0.5 rounded-xl p-2 ${done ? "bg-emerald-500/15 text-emerald-300" : "bg-orange-500/15 text-orange-300"}`}>
          <Icon aria-hidden size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-neutral-400 first-letter:uppercase">{formatDateLong(date)}</p>
          <h2 id="hoy-title" className="font-medium text-white">
            {total === 0
              ? "Aún no hay puestos activos"
              : done
                ? `Hoy ya está capturado: ${captured} de ${total} puestos`
                : captured === 0
                  ? "Hoy todavía no se ha capturado ningún puesto"
                  : missing === 1
                    ? `Hoy falta 1 de ${total} puestos por capturar`
                    : `Hoy faltan ${missing} de ${total} puestos por capturar`}
          </h2>
          {captured > 0 ? (
            <p className="text-sm tabular-nums text-neutral-400">{currency(vendidoReal)} vendido hasta ahora</p>
          ) : null}
        </div>
      </div>
      {total > 0 ? (
        <Link href={done ? `/admin/corte?date=${date}` : `/admin/captura?date=${date}`} className={done ? "btn btn-secondary" : "btn btn-primary"}>
          {done ? "Ver corte del día" : "Capturar hoy"} <ArrowRight aria-hidden size={16} />
        </Link>
      ) : null}
    </section>
  );
}
