"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CHART, currency } from "./chart-theme";
import type { BranchRank } from "@/lib/queries/analytics";

// Forma: magnitud por categoría → barras horizontales, una sola medida
// (Vendido Real) => un solo tono (azul). Ordenado de mayor a menor.
export function BranchRankingChart({ data }: { data: BranchRank[] }) {
  if (data.length === 0) {
    return <Empty />;
  }

  return (
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
            tickFormatter={(v: number) => currency(v)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
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
            formatter={(v: number) => [currency(v), "Vendido Real"]}
          />
          <Bar dataKey="vendidoReal" fill={CHART.single} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl border border-white/10 text-sm text-neutral-500">
      Sin datos de sucursales
    </div>
  );
}
