"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CHART, TIER_LABEL } from "./chart-theme";
import type { SellerRank } from "@/lib/queries/analytics";

// Forma: estado/rendimiento → barras por vendedora coloreadas con el SEMÁFORO
// (paleta de status reservada). El estado NUNCA es solo color: hay leyenda con
// etiquetas y el tier aparece en el tooltip.
export function SellerRankingChart({ data }: { data: SellerRank[] }) {
  if (data.length === 0) {
    return <Empty />;
  }

  return (
    <div>
      <TierLegend />
      <div className="w-full" style={{ height: Math.max(220, data.length * 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
          >
            <CartesianGrid stroke={CHART.ink.grid} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: CHART.ink.muted, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: CHART.ink.baseline }}
              tickFormatter={(v: number) => v.toFixed(0)}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fill: CHART.ink.secondary, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                background: CHART.surface,
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: CHART.ink.primary,
              }}
              formatter={(v, _n, item) => {
                const p = item?.payload as SellerRank | undefined;
                return [
                  `${Number(v).toFixed(1)} pollos · dif ${p ? p.diferencia.toFixed(1) : "-"} · ${
                    p ? TIER_LABEL[p.tier] : ""
                  }`,
                  "Vendido (equiv.)",
                ];
              }}
            />
            <Bar dataKey="equivalentes" radius={[0, 4, 4, 0]}>
              {data.map((d) => (
                <Cell key={d.sellerId} fill={CHART.status[d.tier]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TierLegend() {
  const items: Array<{ tier: "GREEN" | "YELLOW" | "RED" }> = [
    { tier: "GREEN" },
    { tier: "YELLOW" },
    { tier: "RED" },
  ];
  return (
    <div className="mb-3 flex flex-wrap gap-4 text-xs text-neutral-300">
      {items.map(({ tier }) => (
        <span key={tier} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: CHART.status[tier] }}
          />
          {TIER_LABEL[tier]}
        </span>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl border border-white/10 text-sm text-neutral-400">
      Sin datos de vendedoras
    </div>
  );
}
