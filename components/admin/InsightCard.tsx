import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Insight } from "@/lib/datascience/types";

const CONF_LABEL = { high: "Confianza alta", med: "Confianza media", low: "Confianza baja" } as const;
const CONF_CLASS = {
  high: "bg-emerald-500/15 text-emerald-300",
  med: "bg-amber-500/15 text-amber-300",
  low: "bg-neutral-500/15 text-neutral-300",
} as const;

// Tarjeta de texto predictivo (insight). El sentido no es solo color:
// icono + signo + etiqueta de confianza.
export function InsightCard({ insight }: { insight: Insight }) {
  const up = insight.direction === "up";
  const flat = insight.direction === "flat";
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const tone = flat ? "text-neutral-400" : up ? "text-emerald-400" : "text-red-400";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <span className={`flex items-center gap-1.5 text-sm font-semibold ${tone}`}>
          <Icon size={16} />
          {insight.pctChange > 0 ? "+" : ""}
          {insight.pctChange}%
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] ${CONF_CLASS[insight.confidence]}`}>
          {CONF_LABEL[insight.confidence]}
        </span>
      </div>
      <p className="text-sm text-neutral-200">{insight.text}</p>
      <p className="mt-2 text-[11px] text-neutral-500">
        Base ${insight.baseMean.toLocaleString("es-MX")} → ${insight.groupMean.toLocaleString("es-MX")}
      </p>
    </div>
  );
}

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-neutral-500">
        Aún no hay patrones detectados. Carga clima histórico y registra fiestas para
        que el motor encuentre correlaciones.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {insights.map((i) => (
        <InsightCard key={i.id} insight={i} />
      ))}
    </div>
  );
}
