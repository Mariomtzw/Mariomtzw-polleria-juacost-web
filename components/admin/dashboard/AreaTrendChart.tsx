"use client";

import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { CHART, currency } from "@/components/admin/charts/chart-theme";
import type { TrendPoint } from "@/lib/queries/analytics";

export function AreaTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return <div className="flex h-72 items-center justify-center text-sm text-neutral-500">Sin ventas en el periodo</div>;
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.series2} stopOpacity="0.35" />
              <stop offset="100%" stopColor={CHART.series2} stopOpacity="0" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART.ink.grid} vertical={false} />
          <XAxis dataKey="date" tick={{ fill: CHART.ink.muted, fontSize: 12 }} tickLine={false} axisLine={{ stroke: CHART.ink.baseline }} tickFormatter={(d: string) => d.slice(5)} />
          <YAxis tick={{ fill: CHART.ink.muted, fontSize: 12 }} tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => currency(v)} />
          <Tooltip
            contentStyle={{ background: CHART.surface, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, color: CHART.ink.primary }}
            labelStyle={{ color: CHART.ink.secondary }}
            formatter={(v: number, name: string) => [currency(v), name]}
          />
          <Legend wrapperStyle={{ color: CHART.ink.secondary, fontSize: 13 }} />
          <Area type="monotone" dataKey="vendidoReal" name="Vendido Real" stroke={CHART.series2} strokeWidth={2} fill="url(#gradReal)" activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="valorEstimado" name="Valor Estimado" stroke={CHART.series1} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
