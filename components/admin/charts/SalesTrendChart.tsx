"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CHART, currency } from "./chart-theme";
import type { TrendPoint } from "@/lib/queries/analytics";

// Forma: cambio-en-el-tiempo → línea. Dos series categóricas (azul/naranja),
// leyenda presente, tooltip con crosshair. Paleta validada (modo oscuro).
export function SalesTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return <EmptyState label="Sin ventas en el periodo" />;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid stroke={CHART.ink.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: CHART.ink.muted, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: CHART.ink.baseline }}
            tickFormatter={(d: string) => d.slice(5)}
          />
          <YAxis
            tick={{ fill: CHART.ink.muted, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) => currency(v)}
          />
          <Tooltip
            contentStyle={{
              background: CHART.surface,
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: CHART.ink.primary,
            }}
            labelStyle={{ color: CHART.ink.secondary }}
            formatter={(v, name) => [currency(Number(v)), name]}
          />
          <Legend wrapperStyle={{ color: CHART.ink.secondary, fontSize: 13 }} />
          <Line
            type="monotone"
            dataKey="valorEstimado"
            name="Valor Estimado"
            stroke={CHART.series1}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="vendidoReal"
            name="Vendido Real"
            stroke={CHART.series2}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-xl border border-white/10 text-sm text-neutral-400">
      {label}
    </div>
  );
}
