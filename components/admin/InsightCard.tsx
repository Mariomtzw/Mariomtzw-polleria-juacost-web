import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { currency } from "@/components/admin/charts/chart-theme";
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
  const tone = flat ? "text-neutral-300" : up ? "text-emerald-400" : "text-red-400";

  return (
    <li className="material rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`flex items-center gap-1.5 text-sm font-semibold tabular-nums ${tone}`}>
          <Icon aria-hidden size={16} />
          {insight.pctChange > 0 ? "+" : ""}
          {insight.pctChange}%
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs ${CONF_CLASS[insight.confidence]}`}>
          {CONF_LABEL[insight.confidence]}
        </span>
      </div>
      <p className="text-pretty text-sm text-neutral-200">{insight.text}</p>
      <p className="mt-2 text-xs tabular-nums text-neutral-400">
        Promedio normal {currency(insight.baseMean)} → {currency(insight.groupMean)}
      </p>
    </li>
  );
}

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <div className="material rounded-3xl p-8 text-center text-sm text-neutral-400">
        Aún no hay patrones detectados. Carga clima histórico y registra fiestas para
        que el motor encuentre correlaciones.
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {insights.map((i) => (
        <InsightCard key={i.id} insight={i} />
      ))}
    </ul>
  );
}
